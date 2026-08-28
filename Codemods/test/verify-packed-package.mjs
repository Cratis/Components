// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { validateBundledManifest } from '../lib/compatibility.js';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(path.join(tmpdir(), 'cratis-components-codemods-pack-'));
const archive = path.join(scratch, 'codemods.tgz');
const consumer = path.join(scratch, 'consumer');

const run = (command, args, options = {}) =>
    spawnSync(command, args, {
        encoding: 'utf8',
        timeout: 180_000,
        ...options,
    });

const assertRun = (label, result, expectedStatus = 0) => {
    if (result.status !== expectedStatus) {
        throw new Error(
            `${label} exited ${result.status}; expected ${expectedStatus}:\n${result.stderr || result.stdout}`,
        );
    }
};

try {
    const packed = run('yarn', ['pack', '--out', archive], { cwd: packageDir });
    assertRun('yarn pack', packed);
    if (!existsSync(archive)) throw new Error('yarn pack did not create the archive.');

    writeFileSync(
        path.join(scratch, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }),
    );
    const installed = run(
        'npm',
        ['install', '--ignore-scripts', archive, '--prefix', consumer],
        { cwd: scratch },
    );
    assertRun('npm install packed codemod', installed);

    const installedRoot = path.join(
        consumer,
        'node_modules',
        '@cratis',
        'components-codemods',
    );
    const publishedEntries = readdirSync(installedRoot).sort();
    for (const required of [
        'LICENSE',
        'README.md',
        'compat-manifest.json',
        'lib',
        'package.json',
        'scripts',
    ]) {
        if (!publishedEntries.includes(required)) {
            throw new Error(`Packed codemod is missing '${required}'.`);
        }
    }
    for (const forbidden of ['test', 'vitest.config.js']) {
        if (publishedEntries.includes(forbidden)) {
            throw new Error(`Packed codemod leaked '${forbidden}'.`);
        }
    }

    const generatedManifest = readFileSync(
        path.resolve(packageDir, '..', 'compat-manifest.json'),
    );
    const packedManifest = readFileSync(path.join(installedRoot, 'compat-manifest.json'));
    if (!packedManifest.equals(generatedManifest)) {
        throw new Error(
            'Packed codemod compatibility manifest is not byte-identical to the generated root contract.',
        );
    }
    const packedPackage = JSON.parse(
        readFileSync(path.join(installedRoot, 'package.json'), 'utf8'),
    );
    validateBundledManifest(
        JSON.parse(packedManifest.toString('utf8')),
        packedPackage.version,
    );
    for (const dependency of ['semver', 'typescript']) {
        if (!packedPackage.dependencies?.[dependency]) {
            throw new Error(`Packed codemod does not declare '${dependency}'.`);
        }
        if (
            !existsSync(
                path.join(consumer, 'node_modules', dependency, 'package.json'),
            )
        ) {
            throw new Error(`Packed codemod dependency '${dependency}' was not installed.`);
        }
    }

    const componentsRoot = path.join(consumer, 'node_modules', '@cratis', 'components');
    const installSyntheticComponents = (version) => {
        mkdirSync(componentsRoot, { recursive: true });
        writeFileSync(
            path.join(componentsRoot, 'package.json'),
            `${JSON.stringify(
                {
                    name: '@cratis/components',
                    version,
                    exports: { './package.json': './package.json' },
                },
                null,
                4,
            )}\n`,
        );
    };

    const readme = readFileSync(path.join(installedRoot, 'README.md'), 'utf8');
    for (const match of readme.matchAll(/\]\((\.?\.?\/[^)#?\s]+)(?:#[^)]+)?\)/gu)) {
        const target = path.resolve(installedRoot, decodeURIComponent(match[1]));
        if (!target.startsWith(`${installedRoot}${path.sep}`) || !existsSync(target)) {
            throw new Error(`Packed README links to missing file '${match[1]}'.`);
        }
    }

    const binaryFor = (name) =>
        path.join(
            consumer,
            'node_modules',
            '.bin',
            process.platform === 'win32' ? `${name}.cmd` : name,
        );
    const commands = [
        'cratis-components-remove-root-namespace-imports',
        'cratis-components-button-variant-tone',
        'cratis-components-change-handler',
    ];
    for (const command of commands) {
        const commandBinary = binaryFor(command);
        if (process.platform !== 'win32' && (statSync(commandBinary).mode & 0o111) === 0) {
            throw new Error(`Packed ${command} binary is not executable.`);
        }
        const help = run(commandBinary, ['--help'], { cwd: consumer });
        assertRun(`packed ${command} --help without Components`, help);
        if (!help.stdout.includes(`Usage: ${command}`)) {
            throw new Error(`Unexpected ${command} --help output:\n${help.stdout}`);
        }

        const nonexistentInput = path.join(consumer, `${command}-must-not-scan.ts`);
        const absent = run(commandBinary, [nonexistentInput], { cwd: consumer });
        assertRun(`packed ${command} rejects absent Components before scanning`, absent, 1);
        if (
            !absent.stderr.includes('Compatibility preflight failed') ||
            !absent.stderr.includes('Could not resolve installed @cratis/components') ||
            absent.stderr.includes('no such file or directory')
        ) {
            throw new Error(`Unexpected absent-Components preflight output:\n${absent.stderr}`);
        }
    }

    installSyntheticComponents('3.6.1');
    const binary = binaryFor('cratis-components-remove-root-namespace-imports');
    const source = path.join(consumer, 'App.ts');
    writeFileSync(
        source,
        "import { SchemaEditor as EditorNS } from '@cratis/components';\n",
    );

    const pending = run(binary, ['--check', source], { cwd: consumer });
    assertRun('packed codemod --check before migration', pending, 1);
    if (!pending.stdout.includes('1 would change, 0 unsupported')) {
        throw new Error(`Unexpected --check output:\n${pending.stdout}`);
    }

    assertRun('packed codemod apply', run(binary, [source], { cwd: consumer }));
    const migrated = readFileSync(source, 'utf8');
    if (
        !migrated.includes("import * as EditorNS from '@cratis/components/SchemaEditor';")
    ) {
        throw new Error(`Packed codemod produced unexpected output:\n${migrated}`);
    }
    assertRun(
        'packed codemod --check after migration',
        run(binary, ['--check', source], { cwd: consumer }),
    );

    installSyntheticComponents(packedPackage.version);
    const packedMigrations = [
        {
            command: 'cratis-components-button-variant-tone',
            source: "import { Button } from '@cratis/components/Common';\nexport const view = <Button text severity='danger' />;\n",
            expected: ["variant='ghost'", "tone='critical'"],
        },
        {
            command: 'cratis-components-change-handler',
            source: "import { Dropdown } from '@cratis/components/Dropdown';\nexport const view = <Dropdown onChange={(event) => consume(event.value)} />;\n",
            expected: ['(value) => consume(value)'],
        },
    ];

    for (const migration of packedMigrations) {
        const migrationBinary = binaryFor(migration.command);
        const migrationHelp = run(migrationBinary, ['--help'], { cwd: consumer });
        assertRun(`packed ${migration.command} --help`, migrationHelp);
        if (!migrationHelp.stdout.includes(`Usage: ${migration.command}`)) {
            throw new Error(
                `Unexpected ${migration.command} --help output:\n${migrationHelp.stdout}`,
            );
        }

        const migrationSource = path.join(consumer, `${migration.command}.tsx`);
        writeFileSync(migrationSource, migration.source);
        assertRun(
            `packed ${migration.command} --check before migration`,
            run(migrationBinary, ['--check', migrationSource], { cwd: consumer }),
            1,
        );
        assertRun(
            `packed ${migration.command} apply`,
            run(migrationBinary, [migrationSource], { cwd: consumer }),
        );
        const output = readFileSync(migrationSource, 'utf8');
        for (const expected of migration.expected) {
            if (!output.includes(expected)) {
                throw new Error(
                    `Packed ${migration.command} produced unexpected output:\n${output}`,
                );
            }
        }
        assertRun(
            `packed ${migration.command} --check after migration`,
            run(migrationBinary, ['--check', migrationSource], { cwd: consumer }),
        );
    }

    installSyntheticComponents('5.0.0');
    const unsupportedInput = "import { Canvas } from '@cratis/components';\n";
    for (const command of commands) {
        const unsupportedSource = path.join(consumer, `${command}-unsupported.tsx`);
        writeFileSync(unsupportedSource, unsupportedInput);
        const unsupported = run(binaryFor(command), [unsupportedSource], {
            cwd: consumer,
        });
        assertRun(`packed ${command} rejects unsupported Components`, unsupported, 1);
        if (!unsupported.stderr.includes('@cratis/components@5.0.0 is unsupported')) {
            throw new Error(`Unexpected unsupported-version output:\n${unsupported.stderr}`);
        }
        if (readFileSync(unsupportedSource, 'utf8') !== unsupportedInput) {
            throw new Error(
                `Unsupported Components preflight changed source for ${command}.`,
            );
        }
    }

    console.log(
        'Packed @cratis/components-codemods manifest and CLIs verified with Components 3, 4, and unsupported versions.',
    );
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
