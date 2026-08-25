// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
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
    for (const forbidden of ['test', 'vitest.config.js']) {
        if (publishedEntries.includes(forbidden)) {
            throw new Error(`Packed codemod leaked '${forbidden}'.`);
        }
    }

    const binary = path.join(
        consumer,
        'node_modules',
        '.bin',
        process.platform === 'win32'
            ? 'cratis-components-remove-root-namespace-imports.cmd'
            : 'cratis-components-remove-root-namespace-imports',
    );
    const help = run(binary, ['--help'], { cwd: consumer });
    assertRun('packed codemod --help', help);
    if (
        !help.stdout.includes(
            'Usage: cratis-components-remove-root-namespace-imports',
        )
    ) {
        throw new Error(`Unexpected --help output:\n${help.stdout}`);
    }

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

    console.log('Packed @cratis/components-codemods CLI verified.');
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
