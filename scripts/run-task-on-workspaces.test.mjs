// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(repository, '.ai-work/workspace-runner-tests');
mkdirSync(output, { recursive: true });

const runFixture = async ({ command = 'ci', exitCode = 0, outputBytes = 0, missingExecutable = false, signal = undefined } = {}) => {
    const directory = mkdtempSync(path.join(output, 'case-'));
    try {
        copyFileSync(path.join(repository, 'run-task-on-workspaces.js'), path.join(directory, 'run-task-on-workspaces.js'));
        writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ private: true, workspaces: ['first', 'second'] }));
        for (const name of ['first', 'second']) {
            mkdirSync(path.join(directory, name));
            writeFileSync(path.join(directory, name, 'package.json'), JSON.stringify({ name, version: '1.0.0', scripts: { ci: 'synthetic fixture' } }));
        }
        const binaries = path.join(directory, 'bin');
        mkdirSync(binaries);
        if (!missingExecutable) {
            // Both names are synthetic local executables: no package manager or publication runs.
            const executable = `#!${process.execPath}\n` +
                "const fs = require('node:fs'); const path = require('node:path');\n" +
                "const workspace = path.basename(process.cwd());\n" +
                `if (workspace === 'first') fs.writeSync(1, 'x'.repeat(${outputBytes}));\n` +
                "fs.writeSync(1, `\\n${workspace}: stdout complete\\n`);\n" +
                "fs.writeSync(2, `${workspace}: warning detail\\n`);\n" +
                `if (workspace === 'first' && ${JSON.stringify(signal)}) process.kill(process.pid, ${JSON.stringify(signal)});\n` +
                `process.exitCode = workspace === 'first' ? ${exitCode} : 0;\n`;
            for (const name of ['yarn', 'npm']) writeFileSync(path.join(binaries, name), executable, { mode: 0o755 });
        }
        const result = await new Promise((resolve, reject) => {
            const child = spawn(process.execPath, ['run-task-on-workspaces.js', command, ...(command === 'publish-version' ? ['4.7.0'] : [])], {
                cwd: directory,
                env: { ...process.env, PATH: binaries },
                stdio: ['ignore', 'pipe', 'pipe'],
                timeout: 10000,
            });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (chunk) => { stdout += chunk; });
            child.stderr.on('data', (chunk) => { stderr += chunk; });
            child.on('error', reject);
            child.on('close', (code) => resolve({ code, stdout, stderr }));
        });
        return result;
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
};

for (const command of ['ci', 'publish-version']) {
    test(`${command} streams output larger than the default spawnSync buffer without truncation`, { timeout: 20000 }, async () => {
        const bytes = 2 * 1024 * 1024;
        const result = await runFixture({ command, outputBytes: bytes });
        assert.equal(result.code, 0, result.stderr.slice(-1000));
        assert.ok(result.stdout.includes('x'.repeat(bytes)));
        assert.ok(result.stdout.includes('first: stdout complete'));
        assert.ok(result.stdout.includes('second: stdout complete'));
        assert.ok(result.stderr.includes('first: warning detail'));
        assert.ok(result.stderr.includes('second: warning detail'));
    });

    test(`${command} retains failure attribution and both output streams, then stops`, { timeout: 20000 }, async () => {
        const result = await runFixture({ command, outputBytes: 256 * 1024, exitCode: 7 });
        assert.notEqual(result.code, 0);
        assert.ok(result.stdout.includes('first: stdout complete'));
        assert.ok(result.stderr.includes('first: warning detail'));
        assert.match(result.stdout + result.stderr, /(?:running task 'ci' on|publishing) workspace 'first'/u);
        assert.ok(!result.stdout.includes('second: stdout complete'));
    });

    test(`${command} reports signal termination and does not continue`, { timeout: 20000 }, async () => {
        const result = await runFixture({ command, signal: 'SIGTERM' });
        assert.notEqual(result.code, 0);
        assert.match(result.stderr, /Terminated by SIGTERM/u);
        assert.ok(!result.stdout.includes('second: stdout complete'));
    });

    test(`${command} reports a missing executable instead of claiming success`, { timeout: 20000 }, async () => {
        const result = await runFixture({ command, missingExecutable: true });
        assert.notEqual(result.code, 0);
        assert.match(result.stderr, /ENOENT/u);
    });
}
