// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Compares the built public API with a published release of @cratis/components and reports which
 * exports were removed, changed or added. Removals and changes are candidates for a breaking
 * change; a person still decides the release intent, and DOM, parts and behavior need their own
 * review (ADR 0001). The report goes to stdout and, in GitHub Actions, to the job summary.
 *
 * Usage:  node scripts/report-api-compatibility.mjs [version]   (default: latest)
 *         add --fail-on-breaking to exit 1 when anything was removed or changed.
 *
 * Exit codes: 0 when the report was produced (or nothing is breaking with --fail-on-breaking),
 * 1 with --fail-on-breaking when something was removed or changed, 2 when it could not run.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareApiSurfaces, computeApiSurface } from './lib/api-surface.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'latest';
const failOnBreaking = process.argv.includes('--fail-on-breaking');
const packageName = '@cratis/components';

const scratch = mkdtempSync(path.join(os.tmpdir(), 'cratis-api-baseline-'));
try {
    const pack = spawnSync('npm', ['pack', `${packageName}@${version}`, '--silent', '--pack-destination', scratch],
        { encoding: 'utf8' });
    const archive = readdirSync(scratch).find((file) => file.endsWith('.tgz'));
    if (pack.status !== 0 || !archive) {
        console.error(`Could not download ${packageName}@${version}: ${(pack.stderr || pack.stdout || '').trim()}`);
        process.exit(2);
    }
    const extract = spawnSync('tar', ['-xzf', path.join(scratch, archive), '-C', scratch], { encoding: 'utf8' });
    if (extract.status !== 0) {
        console.error(`Could not extract ${archive}: ${extract.stderr.trim()}`);
        process.exit(2);
    }
    const baselineVersion = archive.replace(/^cratis-components-/u, '').replace(/\.tgz$/u, '');

    let baseline;
    let current;
    try {
        baseline = computeApiSurface(path.join(scratch, 'package'));
        current = computeApiSurface(packageDir);
    } catch (error) {
        console.error(`Could not compute an API surface: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(2);
    }
    const { removed, changed, added } = compareApiSurfaces(baseline, current);
    const list = (items) => items.length ? items.map((item) => `- \`${item}\``).join('\n') : '- none';
    const report = [
        `## Public API compared with ${packageName} ${baselineVersion}`,
        '',
        `### Removed (${removed.length}) — breaking unless deliberately deprecated first`,
        list(removed),
        '',
        `### Changed (${changed.length}) — review whether each change is compatible`,
        list(changed),
        '',
        `### Added (${added.length})`,
        list(added),
        '',
        'This compares exported declarations only. DOM, parts and behavior need their own review (ADR 0001).',
        '',
    ].join('\n');
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
    if (failOnBreaking && removed.length + changed.length > 0) process.exit(1);
} finally {
    rmSync(scratch, { recursive: true, force: true });
}
