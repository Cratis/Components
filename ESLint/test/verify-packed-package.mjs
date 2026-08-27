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
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = mkdtempSync(path.join(tmpdir(), 'cratis-components-eslint-pack-'));
const archive = path.join(scratch, 'eslint-plugin.tgz');
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
    assertRun('yarn pack', run('yarn', ['pack', '--out', archive], { cwd: packageDir }));
    if (!existsSync(archive)) throw new Error('yarn pack did not create the archive.');

    writeFileSync(
        path.join(scratch, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }),
    );
    assertRun(
        'npm install packed ESLint plugin',
        run(
            'npm',
            [
                'install',
                '--ignore-scripts',
                archive,
                'eslint@10.9.1',
                '@typescript-eslint/parser@8.68.0',
                '--prefix',
                consumer,
            ],
            { cwd: scratch },
        ),
    );

    const installedRoot = path.join(
        consumer,
        'node_modules',
        '@cratis',
        'eslint-plugin-components',
    );
    const publishedEntries = readdirSync(installedRoot).sort();
    for (const required of ['LICENSE', 'README.md', 'index.js', 'lib', 'package.json']) {
        if (!publishedEntries.includes(required)) {
            throw new Error(`Packed ESLint plugin is missing '${required}'.`);
        }
    }
    for (const forbidden of ['test', 'vitest.config.js']) {
        if (publishedEntries.includes(forbidden)) {
            throw new Error(`Packed ESLint plugin leaked '${forbidden}'.`);
        }
    }

    const readme = readFileSync(path.join(installedRoot, 'README.md'), 'utf8');
    for (const match of readme.matchAll(/\]\((\.?\.?\/[^)#?\s]+)(?:#[^)]+)?\)/gu)) {
        const target = path.resolve(installedRoot, decodeURIComponent(match[1]));
        if (!target.startsWith(`${installedRoot}${path.sep}`) || !existsSync(target)) {
            throw new Error(`Packed README links to missing file '${match[1]}'.`);
        }
    }

    writeFileSync(
        path.join(consumer, 'eslint.config.mjs'),
        [
            "import tsParser from '@typescript-eslint/parser';",
            "import components from '@cratis/eslint-plugin-components';",
            'export default [{',
            "    files: ['**/*.cts'],",
            "    languageOptions: { parser: tsParser, parserOptions: { sourceType: 'module' } },",
            "    plugins: { '@cratis/components': components },",
            "    rules: { '@cratis/components/no-root-barrel-import': 'error' },",
            '}, {',
            "    files: ['Source/PivotViewer/engine/store.ts'],",
            "    languageOptions: { parser: tsParser, parserOptions: { sourceType: 'module' } },",
            "    plugins: { '@cratis/components': components },",
            "    rules: { '@cratis/components/no-react-in-kernel': 'error' },",
            '}];',
            '',
        ].join('\n'),
    );
    const source = path.join(consumer, 'legacy.cts');
    writeFileSync(
        source,
        "import Components = require('@cratis/components');\nvoid Components;\n",
    );
    const binary = path.join(
        consumer,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'eslint.cmd' : 'eslint',
    );
    const violation = run(binary, ['legacy.cts', '--format', 'json'], {
        cwd: consumer,
    });
    assertRun('packed ESLint root-import violation', violation, 1);
    const lintResults = JSON.parse(violation.stdout);
    if (
        lintResults.length !== 1 ||
        lintResults[0].messages.length !== 1 ||
        lintResults[0].messages[0].ruleId !== '@cratis/components/no-root-barrel-import'
    ) {
        throw new Error(`Unexpected packed ESLint output:\n${violation.stdout}`);
    }

    writeFileSync(
        source,
        "import Canvas = require('@cratis/components/Canvas');\nvoid Canvas;\n",
    );
    assertRun(
        'packed ESLint migrated subpath',
        run(binary, ['legacy.cts'], { cwd: consumer }),
    );

    const kernelDir = path.join(consumer, 'Source', 'PivotViewer', 'engine');
    mkdirSync(kernelDir, { recursive: true });
    const kernelSource = path.join(kernelDir, 'store.ts');
    writeFileSync(kernelSource, "const react = await import('react');\nvoid react;\n");
    const kernelViolation = run(binary, [kernelSource, '--format', 'json'], {
        cwd: consumer,
    });
    assertRun('packed ESLint kernel violation', kernelViolation, 1);
    const kernelResults = JSON.parse(kernelViolation.stdout);
    if (
        kernelResults.length !== 1 ||
        kernelResults[0].messages.length !== 1 ||
        kernelResults[0].messages[0].ruleId !== '@cratis/components/no-react-in-kernel'
    ) {
        throw new Error(`Unexpected packed kernel ESLint output:\n${kernelViolation.stdout}`);
    }

    console.log('Packed @cratis/eslint-plugin-components verified.');
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
