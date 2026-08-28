// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    isOwnedDeclarationDiagnostic,
    matchesExternalIssue,
    matchesPairedOwnedCascade,
} from '../../../Source/scripts/lib/public-type-exceptions.mjs';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(packageDirectory, '../..');
const temporary = mkdtempSync(path.join(os.tmpdir(), 'cratis-mui-package-'));

const run = (command, arguments_, cwd = packageDirectory) => {
    const result = spawnSync(command, arguments_, { cwd, encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(
            `${command} ${arguments_.join(' ')} failed:\n${result.stdout}${result.stderr}`,
        );
    }
    return result.stdout;
};

const link = (source, target) => {
    mkdirSync(path.dirname(target), { recursive: true });
    symlinkSync(source, target, 'dir');
};

const parsePackJson = (output) => {
    for (
        let index = output.lastIndexOf('[');
        index >= 0;
        index = output.lastIndexOf('[', index - 1)
    ) {
        try {
            const parsed = JSON.parse(output.slice(index));
            if (Array.isArray(parsed) && parsed[0]?.filename) return parsed;
        } catch {
            // Continue searching backward through lifecycle output for npm's final JSON array.
        }
    }
    throw new Error('npm pack did not produce a parseable JSON result.');
};

try {
    const packedJson = parsePackJson(
        run('npm', ['pack', '--json', '--pack-destination', temporary]),
    );
    const packed = packedJson[0];
    const fileNames = new Set(packed.files.map((file) => file.path));
    for (const required of [
        'dist/index.js',
        'dist/index.d.ts',
        'README.md',
        'CONFORMANCE.md',
        'THIRD_PARTY_NOTICES.md',
        'LICENSE',
        'package.json',
    ]) {
        if (!fileNames.has(required)) {
            throw new Error(`Packed archive is missing '${required}'.`);
        }
    }
    const forbiddenArchiveEntries = [...fileNames].filter((file) =>
        /(?:^|\/)(?:src|for_|scripts|node_modules|coverage|\.yarn)(?:\/|$)|(?:vitest|tsconfig|\.tsbuildinfo|package-lock)/u.test(
            file,
        ),
    );
    if (forbiddenArchiveEntries.length > 0) {
        throw new Error(
            `Packed archive contains source, tests, tooling, or vendor content: ${forbiddenArchiveEntries.join(', ')}.`,
        );
    }

    const archive = path.join(temporary, packed.filename);
    const unpacked = path.join(temporary, 'unpacked');
    mkdirSync(unpacked);
    run('tar', ['-xzf', archive, '-C', unpacked]);
    const unpackedPackage = path.join(unpacked, 'package');

    const corePackedJson = parsePackJson(
        run(
            'npm',
            [
                'pack',
                '--json',
                '--ignore-scripts',
                '--silent',
                '--pack-destination',
                temporary,
            ],
            path.join(repositoryDirectory, 'Source'),
        ),
    );
    const coreArchive = path.join(temporary, corePackedJson[0].filename);
    const unpackedCore = path.join(temporary, 'unpacked-core');
    mkdirSync(unpackedCore);
    run('tar', ['-xzf', coreArchive, '-C', unpackedCore]);
    const unpackedCorePackage = path.join(unpackedCore, 'package');
    const corePackageJson = JSON.parse(
        readFileSync(path.join(unpackedCorePackage, 'package.json'), 'utf8'),
    );
    const packageJson = JSON.parse(
        readFileSync(path.join(unpackedPackage, 'package.json'), 'utf8'),
    );

    const expectedPeers = {
        '@cratis/components': '>=4 <5',
        '@emotion/react': '>=11.5 <12',
        '@emotion/styled': '>=11.3 <12',
        '@mui/material': '>=9 <10',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
    };
    if (JSON.stringify(packageJson.peerDependencies) !== JSON.stringify(expectedPeers)) {
        throw new Error(
            'Packed peer dependencies are not the exact bounded adapter policy.',
        );
    }
    if (packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0) {
        throw new Error(
            'Renderer vendors and Components must never be runtime dependencies.',
        );
    }
    if (
        packageJson.version !== '0.1.0' ||
        packageJson.cratisIndependentVersion !== true ||
        packageJson.cratisUiAbi !== 1
    ) {
        throw new Error(
            'Adapter versioning and renderer ABI metadata must be independent.',
        );
    }
    const serializedPackage = JSON.stringify(packageJson);
    if (serializedPackage.includes('@mui/x-')) {
        throw new Error('MUI X must remain excluded from every package boundary.');
    }

    const runtime = readFileSync(path.join(unpackedPackage, 'dist/index.js'), 'utf8');
    for (const requiredImport of [
        '@mui/material/',
        '@cratis/components/',
        'react/jsx-runtime',
    ]) {
        if (!runtime.includes(requiredImport)) {
            throw new Error(
                `Runtime does not retain expected external import '${requiredImport}'.`,
            );
        }
    }
    for (const bundledSignature of [
        'function createThemeNoVars',
        'function emotionStyled',
        'MUI: The `styles` argument',
    ]) {
        if (runtime.includes(bundledSignature)) {
            throw new Error(
                `Runtime appears to bundle vendor code: '${bundledSignature}'.`,
            );
        }
    }

    const declarationFiles = [...fileNames].filter((file) => file.endsWith('.d.ts'));
    if (declarationFiles.length !== 1) {
        throw new Error(
            `Expected one public declaration file, found ${declarationFiles.length}.`,
        );
    }
    const declarations = readFileSync(
        path.join(unpackedPackage, 'dist/index.d.ts'),
        'utf8',
    );
    for (const forbidden of [
        /\bany\b/u,
        /@mui\//u,
        /@emotion\//u,
        /Mui(?:Button|Checkbox|IconButton|InputBase|LinearProgress|Paper|Radio|Switch|Surface|Text)/u,
        /export\s+(?:type|interface|class|function|default)\b/u,
    ]) {
        if (forbidden.test(declarations)) {
            throw new Error(`Public declarations contain forbidden '${forbidden}'.`);
        }
    }
    const exportedValues = declarations.match(/export\s+declare\s+const\s+/gu) ?? [];
    if (
        exportedValues.length !== 1 ||
        !/export declare const muiUiLibrary: unstable_UiLibrary;/u.test(declarations)
    ) {
        throw new Error(
            'Public declarations must expose exactly one UiLibrary-typed value.',
        );
    }

    const nodeModules = path.join(temporary, 'node_modules');
    link(unpackedPackage, path.join(nodeModules, '@cratis/components.mui'));
    link(unpackedCorePackage, path.join(nodeModules, '@cratis/components'));
    for (const dependency of ['react', 'react-dom']) {
        link(
            path.join(repositoryDirectory, 'node_modules', dependency),
            path.join(nodeModules, dependency),
        );
        link(
            path.join(repositoryDirectory, 'node_modules/@types', dependency),
            path.join(nodeModules, '@types', dependency),
        );
    }
    for (const dependency of ['arc', 'arc.react', 'fundamentals']) {
        link(
            path.join(repositoryDirectory, 'node_modules/@cratis', dependency),
            path.join(nodeModules, '@cratis', dependency),
        );
    }
    for (const dependency of ['reflect-metadata', 'tsyringe']) {
        link(
            path.join(repositoryDirectory, 'node_modules', dependency),
            path.join(nodeModules, dependency),
        );
    }
    for (const dependency of ['react', 'styled']) {
        link(
            path.join(repositoryDirectory, 'node_modules/@emotion', dependency),
            path.join(nodeModules, '@emotion', dependency),
        );
    }
    link(
        path.join(repositoryDirectory, 'node_modules/@mui/material'),
        path.join(nodeModules, '@mui/material'),
    );

    writeFileSync(
        path.join(temporary, 'runtime.mjs'),
        "const api = await import('@cratis/components.mui');\n" +
            "if (Object.keys(api).join(',') !== 'muiUiLibrary') throw new Error('Packed runtime must export only muiUiLibrary.');\n" +
            "if (api.muiUiLibrary.id !== 'cratis-mui') throw new Error('Packed manifest did not load with explicit peers.');\n",
    );
    run(process.execPath, ['runtime.mjs'], temporary);

    writeFileSync(
        path.join(temporary, 'fixture.ts'),
        "import { muiUiLibrary } from '@cratis/components.mui';\nvoid muiUiLibrary;\n",
    );
    writeFileSync(
        path.join(temporary, 'jsx-shim.d.ts'),
        "import type { ReactElement } from 'react';\ndeclare global { namespace JSX { type Element = ReactElement; } }\nexport {};\n",
    );
    const typescript = path.join(repositoryDirectory, 'node_modules/typescript/bin/tsc');
    run(
        process.execPath,
        [
            path.join(repositoryDirectory, 'Source/scripts/verify-public-types.mjs'),
            '--only',
            './renderer',
        ],
        path.join(repositoryDirectory, 'Source'),
    );

    const exceptionMetadata = JSON.parse(
        readFileSync(
            path.join(
                repositoryDirectory,
                'Source/scripts/verify-public-types.exceptions.json',
            ),
            'utf8',
        ),
    );
    const nodeNextIssue = exceptionMetadata.upstreamIssues.find(
        (issue) => issue.id === 'arc-family-nodenext-extensionless-specifiers',
    );
    if (!nodeNextIssue) {
        throw new Error('NodeNext upstream exception metadata is missing.');
    }
    const parseDiagnostics = (stdout) => {
        const diagnosticLine = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/u;
        return stdout
            .split(/\r?\n/u)
            .map((line) => line.match(diagnosticLine))
            .filter(Boolean)
            .map((match) => {
                const [, rawFile, lineNo, , code, message] = match;
                const absolute = path.resolve(rawFile);
                const marker = `${path.sep}node_modules${path.sep}`;
                const lastNodeModules = absolute.lastIndexOf(marker);
                let file;
                if (lastNodeModules >= 0) {
                    file = absolute
                        .slice(lastNodeModules + marker.length)
                        .split(path.sep)
                        .join('/');
                } else if (absolute.startsWith(`${unpackedCorePackage}${path.sep}`)) {
                    file = `@cratis/components/${path
                        .relative(unpackedCorePackage, absolute)
                        .split(path.sep)
                        .join('/')}`;
                } else {
                    file = path.relative(temporary, absolute).split(path.sep).join('/');
                }
                return { code, file, line: Number(lineNo), message };
            });
    };

    for (const resolution of ['bundler', 'nodenext']) {
        const result = spawnSync(
            process.execPath,
            [
                typescript,
                '--ignoreConfig',
                '--noEmit',
                '--strict',
                '--skipLibCheck',
                'false',
                '--target',
                'ES2022',
                '--module',
                resolution === 'bundler' ? 'ESNext' : 'NodeNext',
                '--moduleResolution',
                resolution,
                '--jsx',
                'react-jsx',
                '--lib',
                'ESNext,DOM,DOM.Iterable',
                'fixture.ts',
                'jsx-shim.d.ts',
            ],
            { cwd: temporary, encoding: 'utf8' },
        );
        const diagnostics = parseDiagnostics(result.stdout ?? '');
        if (result.status !== 0 && diagnostics.length === 0) {
            throw new Error(
                `Strict ${resolution} consumer failed without parseable diagnostics:\n${result.stdout}${result.stderr}`,
            );
        }
        const covered = (diagnostic) =>
            nodeNextIssue.resolutionModes.includes(resolution) &&
            (matchesExternalIssue(diagnostic, nodeNextIssue, corePackageJson.name) ||
                matchesPairedOwnedCascade(
                    diagnostic,
                    nodeNextIssue,
                    diagnostics,
                    corePackageJson.name,
                ));
        const unexpected = diagnostics.filter((diagnostic) => !covered(diagnostic));
        if (unexpected.length > 0) {
            throw new Error(
                `Strict ${resolution} consumer produced unexpected diagnostics:\n${unexpected
                    .map(
                        (diagnostic) =>
                            `${diagnostic.file}:${diagnostic.line} ${diagnostic.code} ${diagnostic.message}`,
                    )
                    .join('\n')}`,
            );
        }
        if (
            diagnostics.some((diagnostic) =>
                isOwnedDeclarationDiagnostic(diagnostic, packageJson.name),
            )
        ) {
            throw new Error(
                `Strict ${resolution} consumer reported a declaration owned by ${packageJson.name}.`,
            );
        }
    }

    console.log(
        `Verified ${packageJson.name}@${packageJson.version}: archive boundaries, external vendor peers, ` +
            'packed Core runtime import, one hygienic UiLibrary declaration, and strict Bundler/NodeNext consumers with bounded upstream exceptions.',
    );
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
