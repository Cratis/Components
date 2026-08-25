// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.join(__dirname, '..', 'scripts', 'remove-root-namespace-imports.js');

let dir;

beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'cratis-components-codemod-'));
});

afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
});

const run = (args) =>
    spawnSync(process.execPath, [binPath, ...args], { encoding: 'utf8' });

describe('remove-root-namespace-imports CLI', () => {
    it('prints usage and exits non-zero with no arguments', () => {
        const result = run([]);
        expect(result.status).toBe(1);
        expect(result.stdout).toContain('Usage:');
    });

    it('prints public command help and exits 0', () => {
        const result = run(['--help']);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain(
            'Usage: cratis-components-remove-root-namespace-imports',
        );
    });

    it('rejects an unknown option', () => {
        const result = run(['--chek']);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Unknown option: --chek');
    });

    it('rejects --package without a package name', () => {
        const result = run(['--package']);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('--package requires a package name');
    });

    it('reports a missing input path without a stack trace', () => {
        const missing = path.join(dir, 'missing');
        const result = run([missing]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('no such file or directory');
        expect(result.stderr).not.toContain('at collectFiles');
    });

    it('--check reports a pending change without writing the file', () => {
        const file = path.join(dir, 'App.tsx');
        writeFileSync(file, "import { Canvas } from '@cratis/components';\n", 'utf8');

        const result = run(['--check', file]);

        expect(result.status).toBe(1);
        expect(result.stdout).toContain('would rewrite');
        expect(readFileSync(file, 'utf8')).toBe(
            "import { Canvas } from '@cratis/components';\n",
        );
    });

    it('rewrites a matching file in place and exits 0 when nothing is unsupported', () => {
        const file = path.join(dir, 'App.tsx');
        writeFileSync(file, "import { Canvas } from '@cratis/components';\n", 'utf8');

        const result = run([file]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('rewrote');
        expect(readFileSync(file, 'utf8')).toBe(
            "import * as Canvas from '@cratis/components/Canvas';\n",
        );
    });

    it('walks a directory recursively, skipping node_modules', () => {
        const nested = path.join(dir, 'src', 'nested');
        const skipped = path.join(dir, 'node_modules', 'pkg');
        mkdirSync(nested, { recursive: true });
        mkdirSync(skipped, { recursive: true });
        writeFileSync(
            path.join(nested, 'Component.tsx'),
            "import { Canvas } from '@cratis/components';\n",
            'utf8',
        );
        writeFileSync(
            path.join(skipped, 'index.ts'),
            "import { Canvas } from '@cratis/components';\n",
            'utf8',
        );

        const result = run([dir]);

        expect(result.status).toBe(0);
        expect(readFileSync(path.join(nested, 'Component.tsx'), 'utf8')).toBe(
            "import * as Canvas from '@cratis/components/Canvas';\n",
        );
        expect(readFileSync(path.join(skipped, 'index.ts'), 'utf8')).toBe(
            "import { Canvas } from '@cratis/components';\n",
        );
    });

    it('exits non-zero and reports an unsupported case without writing', () => {
        const file = path.join(dir, 'App.tsx');
        writeFileSync(
            file,
            "import * as Components from '@cratis/components';\n",
            'utf8',
        );

        const result = run([file]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Namespace import');
        expect(readFileSync(file, 'utf8')).toBe(
            "import * as Components from '@cratis/components';\n",
        );
    });

    it('reports a TypeScript import assignment in a .cts file', () => {
        const file = path.join(dir, 'legacy.cts');
        writeFileSync(
            file,
            "import Components = require('@cratis/components');\n",
            'utf8',
        );

        const result = run(['--check', file]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Import-assignment');
        expect(readFileSync(file, 'utf8')).toContain("require('@cratis/components')");
    });

    it('running twice in a row is idempotent and the second run exits 0', () => {
        const file = path.join(dir, 'App.tsx');
        writeFileSync(
            file,
            "import { Canvas, CratisComponentsProvider } from '@cratis/components';\n",
            'utf8',
        );

        run([file]);
        const afterFirst = readFileSync(file, 'utf8');
        const second = run([file]);

        expect(second.status).toBe(0);
        expect(readFileSync(file, 'utf8')).toBe(afterFirst);
    });
});
