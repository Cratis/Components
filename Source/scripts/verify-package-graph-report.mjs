// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = mkdtempSync(path.join(os.tmpdir(), 'cratis-package-graph-report-'));
const reportPath = path.join(temporary, 'report.json');

try {
    const result = spawnSync(
        process.execPath,
        ['scripts/verify-package-graph.mjs', '--report', reportPath],
        { cwd: packageDirectory, encoding: 'utf8' },
    );
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.status !== 0) {
        throw new Error(
            `Package graph report verification exited with ${String(result.status)}.`,
        );
    }

    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    if (
        JSON.stringify(report.coreSlotIsolationSubpaths) !==
        JSON.stringify(['./renderer/builtin'])
    ) {
        throw new Error(
            'Package graph report contains the wrong Core-slot isolation subpaths.',
        );
    }
    if (
        JSON.stringify(report.leanCoreSlotSubpaths) !== JSON.stringify(['.', './Common'])
    ) {
        throw new Error(
            'Package graph report contains the wrong lean Core-slot subpaths.',
        );
    }
    if (!Array.isArray(report.kernelBoundary) || report.kernelBoundary.length !== 34) {
        throw new Error(
            'Package graph report must contain all 34 kernel boundary entries.',
        );
    }
    if (!Array.isArray(report.violations) || report.violations.length !== 0) {
        throw new Error('Package graph report contains module-boundary violations.');
    }

    console.log('Package graph report metadata and all 34 kernel entries verified.');
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
