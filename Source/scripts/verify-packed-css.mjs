// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Run the same archive check as CI against the built publish artifact, without leaving a tarball.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(path.join(tmpdir(), 'cratis-components-packed-css-'));
const archive = path.join(temporary, 'components.tgz');

try {
    const packed = spawnSync('yarn', ['pack', '--out', archive], {
        cwd: packageDir,
        encoding: 'utf8',
        timeout: 180_000,
    });
    if (packed.error) throw packed.error;
    if (packed.status !== 0) {
        throw new Error(`\`yarn pack\` failed:\n${packed.stderr || packed.stdout}`);
    }

    const verified = spawnSync('yarn', ['verify-package-archive', archive], {
        cwd: packageDir,
        stdio: 'inherit',
        timeout: 180_000,
    });
    if (verified.error) throw verified.error;
    if (verified.status !== 0) process.exitCode = verified.status ?? 1;
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
