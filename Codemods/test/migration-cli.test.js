// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.join(testDir, '..', 'scripts');
let dir;

beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'cratis-components-migration-codemod-'));
    for (const packageName of ['@cratis/components', '@example/ui']) {
        const [scope, name] = packageName.split('/');
        const packageDirectory = path.join(dir, 'node_modules', scope, name);
        mkdirSync(packageDirectory, { recursive: true });
        writeFileSync(
            path.join(packageDirectory, 'package.json'),
            JSON.stringify({
                name: packageName,
                version: '4.0.0',
                exports: { './package.json': './package.json' },
            }),
        );
    }
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

const commands = [
    {
        name: 'button-variant-tone',
        publicName: 'cratis-components-button-variant-tone',
        source: "import { Button } from '@cratis/components/Common';\nexport const x=<Button text/>;\n",
        expected: "variant='ghost'",
        refusal:
            "import { Button } from '@cratis/components/Common';\nexport const x=<Button text={dynamic}/>;\n",
    },
    {
        name: 'change-handler',
        publicName: 'cratis-components-change-handler',
        source: "import { Dropdown } from '@cratis/components/Dropdown';\nexport const x=<Dropdown onChange={(e)=>consume(e.value)}/>;\n",
        expected: '(value)=>consume(value)',
        refusal:
            "import { Dropdown } from '@cratis/components/Dropdown';\nexport const x=<Dropdown onChange={(event)=>{log(event);consume(event.value)}}/>;\n",
    },
];

for (const command of commands) {
    const run = (args) =>
        spawnSync(
            process.execPath,
            [path.join(scriptsDir, `${command.name}.js`), ...args],
            { cwd: dir, encoding: 'utf8' },
        );

    describe(`${command.publicName} CLI`, () => {
        it('prints public help, requires paths, and rejects unknown options', () => {
            const help = run(['--help']);
            expect(help.status).toBe(0);
            expect(help.stdout).toContain(`Usage: ${command.publicName}`);
            expect(run([]).status).toBe(1);
            expect(run(['--unknown']).stderr).toContain('Unknown option');
            expect(run(['--package']).stderr).toContain(
                '--package requires a package name',
            );
        });

        it('supports check/apply/idempotent check', () => {
            const file = path.join(dir, 'Component.tsx');
            writeFileSync(file, command.source);
            const pending = run(['--check', file]);
            expect(pending.status).toBe(1);
            expect(pending.stdout).toContain('would rewrite');
            expect(readFileSync(file, 'utf8')).toBe(command.source);

            const apply = run([file]);
            expect(apply.status).toBe(0);
            expect(readFileSync(file, 'utf8')).toContain(command.expected);
            expect(run(['--check', file]).status).toBe(0);
        });

        it('walks supported extensions recursively and skips node_modules', () => {
            const nested = path.join(dir, 'src', 'nested');
            const skipped = path.join(dir, 'node_modules', 'pkg');
            mkdirSync(nested, { recursive: true });
            mkdirSync(skipped, { recursive: true });
            const transformFiles = ['a.jsx', 'e.tsx'];
            const scanOnlyFiles = ['b.mjs', 'c.cjs', 'd.ts', 'f.mts', 'g.cts'];
            for (const file of transformFiles)
                writeFileSync(path.join(nested, file), command.source);
            for (const file of scanOnlyFiles)
                writeFileSync(path.join(nested, file), 'export const scanned = true;\n');
            writeFileSync(path.join(skipped, 'ignored.tsx'), command.source);

            const result = run([dir]);
            expect(result.status).toBe(0);
            expect(result.stdout).toContain('7 file(s) scanned');
            for (const file of transformFiles)
                expect(readFileSync(path.join(nested, file), 'utf8')).toContain(
                    command.expected,
                );
            for (const file of scanOnlyFiles)
                expect(readFileSync(path.join(nested, file), 'utf8')).toBe(
                    'export const scanned = true;\n',
                );
            expect(readFileSync(path.join(skipped, 'ignored.tsx'), 'utf8')).toBe(
                command.source,
            );
        });

        it('writes one TODO but exits nonzero for refusal in apply and subsequent runs', () => {
            const file = path.join(dir, 'Refusal.tsx');
            writeFileSync(file, command.refusal);
            const first = run([file]);
            expect(first.status).toBe(1);
            expect(first.stderr).toContain('manual review');
            const once = readFileSync(file, 'utf8');
            expect(once.match(/TODO\(cratis-codemod\)/gu)).toHaveLength(1);

            const second = run([file]);
            expect(second.status).toBe(1);
            expect(readFileSync(file, 'utf8')).toBe(once);
        });

        it('honors --package', () => {
            const file = path.join(dir, 'Custom.tsx');
            writeFileSync(
                file,
                command.source.replaceAll('@cratis/components', '@example/ui'),
            );
            expect(run(['--package', '@example/ui', file]).status).toBe(0);
            expect(readFileSync(file, 'utf8')).toContain(command.expected);
        });
    });
}
