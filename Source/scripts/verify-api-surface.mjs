// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Keeps a reviewable snapshot of the published API: every export of every typed subpath, with the
 * text of its declaration. Any change to the public surface shows up in the snapshot's diff, so a
 * pull request states exactly which exports it adds, removes or changes.
 *
 * Usage:  node scripts/verify-api-surface.mjs            (check the built declarations)
 *         node scripts/verify-api-surface.mjs --update   (rewrite api-surface.json)
 *
 * Exit codes: 0 when the snapshot matches, 1 when it differs, 2 when it could not run.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareApiSurfaces, computeApiSurface, serializeApiSurface } from './lib/api-surface.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshotPath = path.join(packageDir, 'api-surface.json');

// The comparison must name every kind of difference; plant one of each.
const planted = compareApiSurfaces(
    { './A': { kept: 'kept', removed: 'removed', changed: 'before' }, './Gone': { x: 'x' } },
    { './A': { kept: 'kept', changed: 'after', added: 'added' }, './New': { y: 'y' } },
);
if (planted.removed.join() !== './A#removed,./Gone (subpath removed)' ||
    planted.changed.join() !== './A#changed' ||
    planted.added.join() !== './A#added,./New (new subpath)') {
    console.error(`The API surface comparison missed a planted difference: ${JSON.stringify(planted)}`);
    process.exit(2);
}

let surface;
try {
    surface = computeApiSurface(packageDir);
} catch (error) {
    console.error(`Could not compute the API surface: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Build the declarations first: yarn g:build');
    process.exit(2);
}
const subpathCount = Object.keys(surface).length;
const exportCount = Object.values(surface).reduce((total, exports) => total + Object.keys(exports).length, 0);
if (subpathCount === 0 || exportCount === 0) {
    console.error('No typed subpaths or exports were found; the check would pass vacuously.');
    process.exit(2);
}

if (process.argv.includes('--update')) {
    writeFileSync(snapshotPath, serializeApiSurface(surface));
    console.log(`Wrote ${path.relative(process.cwd(), snapshotPath)} (${subpathCount} subpaths, ${exportCount} exports).`);
    process.exit(0);
}

if (!existsSync(snapshotPath)) {
    console.error(`${snapshotPath} is missing. Run yarn generate-api-surface and commit it.`);
    process.exit(1);
}
const committed = JSON.parse(readFileSync(snapshotPath, 'utf8'));
const { removed, changed, added } = compareApiSurfaces(committed, surface);
if (removed.length + changed.length + added.length > 0) {
    const section = (title, items) => items.length ? `${title}:\n- ${items.join('\n- ')}\n` : '';
    console.error(
        'The public API differs from the committed api-surface.json.\n' +
            section('Removed', removed) + section('Changed', changed) + section('Added', added) +
            'Review the change, then run yarn generate-api-surface and commit the snapshot.',
    );
    process.exit(1);
}
console.log(`The public API matches api-surface.json (${subpathCount} subpaths, ${exportCount} exports checked).`);
