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

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(packageDirectory, '..');
const temporary = mkdtempSync(path.join(os.tmpdir(), 'cratis-conformance-package-'));

const run = (command, arguments_, cwd = packageDirectory) => {
    const result = spawnSync(command, arguments_, { cwd, encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(
            `${command} ${arguments_.join(' ')} failed:\n${result.stdout}${result.stderr}`,
        );
    }
    return result.stdout;
};

try {
    const packedJson = JSON.parse(
        run('npm', ['pack', '--json', '--pack-destination', temporary]),
    );
    const packed = packedJson[0];
    const fileNames = new Set(packed.files.map((file) => file.path));
    for (const required of [
        'dist/index.js',
        'dist/index.d.ts',
        'README.md',
        'CONFORMANCE.md',
        'LICENSE',
        'package.json',
    ]) {
        if (!fileNames.has(required))
            throw new Error(`Packed archive is missing '${required}'.`);
    }
    if ([...fileNames].some((file) => /(?:for_|vitest|\.tsbuildinfo)/u.test(file))) {
        throw new Error('Packed archive contains test or build-cache files.');
    }

    const archive = path.join(temporary, packed.filename);
    const unpacked = path.join(temporary, 'unpacked');
    mkdirSync(unpacked);
    run('tar', ['-xzf', archive, '-C', unpacked]);
    const packageJson = JSON.parse(
        readFileSync(path.join(unpacked, 'package/package.json'), 'utf8'),
    );
    const sourcePackageJson = JSON.parse(
        readFileSync(path.join(repositoryDirectory, 'Source/package.json'), 'utf8'),
    );
    if (
        packageJson.version !== sourcePackageJson.version ||
        Object.hasOwn(packageJson, 'cratisIndependentVersion') ||
        packageJson.cratisUiAbi !== 1
    ) {
        throw new Error(
            'Conformance must share the repository release version while keeping renderer ABI major 1 explicit.',
        );
    }
    if (packageJson.dependencies?.['@cratis/components']) {
        throw new Error(
            'Conformance must not install Components as a runtime dependency.',
        );
    }

    const declarationFiles = [...fileNames].filter((file) => file.endsWith('.d.ts'));
    for (const declarationFile of declarationFiles) {
        const declarations = readFileSync(
            path.join(unpacked, 'package', declarationFile),
            'utf8',
        );
        for (const forbidden of [
            /\bany\b/u,
            /@mui\//u,
            /primereact/u,
            /primeuix/u,
            /react-aria/u,
        ]) {
            if (forbidden.test(declarations)) {
                throw new Error(
                    `Public declaration '${declarationFile}' contains forbidden '${forbidden}'.`,
                );
            }
        }
    }

    const packageNodeModules = path.join(temporary, 'node_modules');
    const cratisNodeModules = path.join(packageNodeModules, '@cratis');
    const typesNodeModules = path.join(packageNodeModules, '@types');
    mkdirSync(cratisNodeModules, { recursive: true });
    mkdirSync(typesNodeModules, { recursive: true });
    symlinkSync(
        path.join(unpacked, 'package'),
        path.join(cratisNodeModules, 'components.conformance'),
        'dir',
    );
    symlinkSync(
        path.join(repositoryDirectory, 'Source'),
        path.join(cratisNodeModules, 'components'),
        'dir',
    );
    for (const dependency of ['axe-core', 'react', 'react-dom']) {
        symlinkSync(
            path.join(repositoryDirectory, 'node_modules', dependency),
            path.join(packageNodeModules, dependency),
            'dir',
        );
    }
    for (const dependency of ['react', 'react-dom']) {
        symlinkSync(
            path.join(repositoryDirectory, 'node_modules/@types', dependency),
            path.join(typesNodeModules, dependency),
            'dir',
        );
    }
    writeFileSync(
        path.join(temporary, 'runtime.mjs'),
        "const api = await import('@cratis/components.conformance');\n" +
            "if (typeof api.runConformance !== 'function') throw new Error('Packed runtime entry did not export runConformance.');\n",
    );
    run(process.execPath, ['runtime.mjs'], temporary);
    writeFileSync(
        path.join(temporary, 'fixture.ts'),
        "import { runConformance, type ConformanceReport } from '@cratis/components.conformance';\nvoid runConformance;\nconst report = undefined as unknown as ConformanceReport;\nvoid report;\n",
    );
    writeFileSync(
        path.join(temporary, 'jsx-shim.d.ts'),
        "import type { ReactElement } from 'react';\ndeclare global { namespace JSX { type Element = ReactElement; } }\nexport {};\n",
    );

    const typescript = path.join(repositoryDirectory, 'node_modules/typescript/bin/tsc');
    for (const resolution of ['bundler', 'nodenext']) {
        const moduleKind = resolution === 'bundler' ? 'ESNext' : 'NodeNext';
        run(
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
                moduleKind,
                '--moduleResolution',
                resolution,
                '--jsx',
                'react-jsx',
                '--lib',
                'ESNext,DOM,DOM.Iterable',
                'fixture.ts',
                'jsx-shim.d.ts',
            ],
            temporary,
        );
    }

    console.log(
        `Verified ${packageJson.name}@${packageJson.version}: archive contents, independent ABI metadata, ` +
            `${declarationFiles.length} pure declaration files, packed runtime import, and strict Bundler/NodeNext consumers.`,
    );
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
