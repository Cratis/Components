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
const temporary = mkdtempSync(path.join(packageDirectory, '.verify-package-'));

const run = (command, arguments_, cwd = packageDirectory) => {
    const result = spawnSync(command, arguments_, { cwd, encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(`${command} ${arguments_.join(' ')} failed:\n${result.stdout}${result.stderr}`);
    }
    return result.stdout;
};

try {
    const packedJson = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', temporary]));
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
        if (!fileNames.has(required)) throw new Error(`Packed archive is missing '${required}'.`);
    }
    if ([...fileNames].some((file) => /(?:for_|vitest|\.tsbuildinfo)/u.test(file))) {
        throw new Error('Packed archive contains test or build-cache files.');
    }

    const archive = path.join(temporary, packed.filename);
    const unpacked = path.join(temporary, 'unpacked');
    mkdirSync(unpacked);
    run('tar', ['-xzf', archive, '-C', unpacked]);
    const packageJson = JSON.parse(readFileSync(path.join(unpacked, 'package/package.json'), 'utf8'));
    if (packageJson.version !== '0.1.0' || packageJson.cratisUiAbi !== 1) {
        throw new Error('Package version and renderer ABI major are not independently pinned.');
    }
    if (packageJson.dependencies?.['@cratis/components']) {
        throw new Error('Conformance must not install Components as a runtime dependency.');
    }

    const declarations = readFileSync(path.join(unpacked, 'package/dist/index.d.ts'), 'utf8');
    for (const forbidden of [/\bany\b/u, /@mui\//u, /primereact/u, /primeuix/u, /react-aria/u]) {
        if (forbidden.test(declarations)) throw new Error(`Public declarations contain forbidden '${forbidden}'.`);
    }

    const nodeModules = path.join(temporary, 'node_modules/@cratis');
    mkdirSync(nodeModules, { recursive: true });
    symlinkSync(
        path.join(unpacked, 'package'),
        path.join(nodeModules, 'components.conformance'),
        'dir',
    );
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
        run(process.execPath, [
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
        ], temporary);
    }

    console.log(
        `Verified ${packageJson.name}@${packageJson.version}: archive contents, ABI metadata, ` +
        'pure declarations, and strict Bundler/NodeNext consumers.',
    );
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
