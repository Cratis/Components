// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const archive = process.argv[2];
if (!archive) {
    console.error('Usage: node scripts/verify-package-archive.mjs <package.tgz>');
    process.exit(1);
}

const runTar = (...args) => {
    const result = spawnSync('tar', args, { encoding: 'utf8' });
    if (result.status !== 0) {
        console.error(result.stderr || `tar ${args.join(' ')} failed`);
        process.exit(1);
    }
    return result.stdout;
};

const normalizedArchive = path.resolve(archive);
const entries = new Set(
    runTar('-tzf', normalizedArchive).split(/\r?\n/u).filter(Boolean),
);
const requiredEntries = [
    'package/LICENSE',
    'package/README.md',
    'package/THIRD_PARTY_NOTICES.md',
    'package/dist/esm/PatrickHand-OFL.txt',
    'package/dist/esm/PatrickHand-latin.woff2',
    'package/dist/esm/PatrickHand-latin-ext.woff2',
    'package/dist/esm/PatrickHand-vietnamese.woff2',
];
const missing = requiredEntries.filter((entry) => !entries.has(entry));
if (missing.length > 0) {
    console.error(
        `Package archive is missing required notices/assets:\n- ${missing.join('\n- ')}`,
    );
    process.exit(1);
}

const license = runTar('-xOzf', normalizedArchive, 'package/LICENSE');
if (!license.includes('MIT License') || !license.includes('Copyright (c) 2025 Cratis')) {
    console.error('Package LICENSE does not contain the expected Cratis MIT notice.');
    process.exit(1);
}

const notices = runTar('-xOzf', normalizedArchive, 'package/THIRD_PARTY_NOTICES.md');
for (const expected of [
    'Allotment structural stylesheet',
    'John Walley',
    'Gobalsky Labs Ltd.',
    'Microsoft Corporation',
    'Tailwind CSS generated theme and utility output',
    'Tailwind Labs, Inc.',
    'Patrick Hand font',
]) {
    if (!notices.includes(expected)) {
        console.error(`THIRD_PARTY_NOTICES.md is missing '${expected}'.`);
        process.exit(1);
    }
}

console.log(
    `Package archive notices and bundled assets are complete: ${normalizedArchive}`,
);
