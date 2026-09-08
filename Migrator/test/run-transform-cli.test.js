// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runTransformCli } from '../lib/runTransformCli.js';

const temporaryDirectories = [];

afterEach(() => {
    vi.restoreAllMocks();
    for (const directory of temporaryDirectories.splice(0)) {
        rmSync(directory, { recursive: true, force: true });
    }
});

describe('runTransformCli', () => {
    it('should report a processing failure and continue without throwing', () => {
        const directory = mkdtempSync(path.join(tmpdir(), 'cratis-transform-error-'));
        temporaryDirectories.push(directory);
        const first = path.join(directory, 'first.ts');
        const second = path.join(directory, 'second.ts');
        writeFileSync(first, 'export const first = true;\n');
        writeFileSync(second, 'export const second = true;\n');
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        const visited = [];

        const exitCode = runTransformCli([first, second], {
            command: 'example-transform',
            description: 'Example transform.',
            transform: (file, text) => {
                visited.push(file);
                if (file === first) throw new Error('planted transform failure');
                return { text, changed: false, diagnostics: [] };
            },
        });

        expect(exitCode).toBe(1);
        expect(visited).toEqual([first, second]);
        expect(error).toHaveBeenCalledWith(
            `${first}: failed to process: planted transform failure`,
        );
        expect(log.mock.calls.at(-1)?.[0]).toContain('1 processing error(s)');
    });
});
