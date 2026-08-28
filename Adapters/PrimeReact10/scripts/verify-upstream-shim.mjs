// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDirectory = path.resolve(packageDirectory, '../..');
const temporary = mkdtempSync(
    path.join(packageDirectory, '.verify-primereact10-shim-'),
);

try {
    const primeReactPackage = JSON.parse(
        readFileSync(
            path.join(packageDirectory, 'node_modules/primereact/package.json'),
            'utf8',
        ),
    );
    if (
        primeReactPackage.version !== '10.9.8' ||
        primeReactPackage.license !== 'MIT' ||
        !primeReactPackage.peerDependencies?.react?.includes('^19.0.0') ||
        !primeReactPackage.peerDependencies?.['react-dom']?.includes('^19.0.0')
    ) {
        throw new Error(
            'The compile-only API shim is reviewed only for MIT PrimeReact 10.9.8 with React 19 peers.',
        );
    }

    const fixture = path.join(temporary, 'fixture.ts');
    writeFileSync(
        fixture,
        "import { PrimeReactProvider } from 'primereact/api';\nvoid PrimeReactProvider;\n",
    );
    const typescript = path.join(repositoryDirectory, 'node_modules/typescript/bin/tsc');
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
            'ESNext',
            '--moduleResolution',
            'bundler',
            '--lib',
            'ESNext,DOM,DOM.Iterable',
            fixture,
        ],
        { cwd: packageDirectory, encoding: 'utf8' },
    );
    const diagnostics = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    const expectedFiles = [
        'fieldset/fieldset.d.ts',
        'inplace/inplace.d.ts',
        'panel/panel.d.ts',
        'treeselect/treeselect.d.ts',
        'treetable/treetable.d.ts',
    ];
    const diagnosticLines = diagnostics
        .split(/\r?\n/u)
        .filter((line) => line.includes('error TS'));
    const missing = expectedFiles.filter(
        (file) =>
            !diagnosticLines.some(
                (line) => line.includes(file) && line.includes('error TS2430'),
            ),
    );
    const jsxDiagnostics = diagnosticLines.filter(
        (line) =>
            line.includes('node_modules/primereact/') &&
            line.includes("error TS2503: Cannot find namespace 'JSX'."),
    );
    const unexpected = diagnosticLines.filter(
        (line) =>
            !expectedFiles.some(
                (file) => line.includes(file) && line.includes('error TS2430'),
            ) && !jsxDiagnostics.includes(line),
    );
    if (
        result.status === 0 ||
        missing.length > 0 ||
        jsxDiagnostics.length !== 44 ||
        unexpected.length > 0
    ) {
        throw new Error(
            'PrimeReact 10.9.8 API declaration defect changed; remove or re-review ' +
                `src/primereact10-api-shim.d.ts and src/upstream-type-shim.d.ts. ` +
                `Missing: ${missing.join(', ') || 'none'}. JSX count: ${jsxDiagnostics.length}. ` +
                `Unexpected: ${unexpected.join(' | ') || 'none'}.`,
        );
    }

    const emittedDeclaration = readFileSync(
        path.join(packageDirectory, 'dist/index.d.ts'),
        'utf8',
    );
    if (
        emittedDeclaration.includes('primereact10-api-shim') ||
        emittedDeclaration.includes('primereact/api')
    ) {
        throw new Error('The compile-only PrimeReact 10 API shim leaked into declarations.');
    }

    console.log(
        'Verified the exact PrimeReact 10.9.8/React 19 TS2430 and global-JSX defects, their removal trigger, and non-emission of the compile-only shims.',
    );
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
