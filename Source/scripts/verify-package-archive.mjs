// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
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
    'package/MIGRATION.md',
    'package/THIRD_PARTY_NOTICES.md',
    'package/dist/esm/styles.css',
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

const verifyPackedMarkdownLinks = (entry) => {
    const markdown = runTar('-xOzf', normalizedArchive, entry);
    for (const match of markdown.matchAll(/\]\((\.?\.?\/[^)#?\s]+)(?:#[^)]+)?\)/gu)) {
        const target = path.posix.normalize(
            path.posix.join(path.posix.dirname(entry), decodeURIComponent(match[1])),
        );
        if (!target.startsWith('package/') || !entries.has(target)) {
            console.error(`${entry} links to missing packed file '${match[1]}'.`);
            process.exit(1);
        }
    }
};

verifyPackedMarkdownLinks('package/README.md');
verifyPackedMarkdownLinks('package/MIGRATION.md');

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

const styles = runTar('-xOzf', normalizedArchive, 'package/dist/esm/styles.css');
const styleBytes = Buffer.byteLength(styles);
const gzipBytes = gzipSync(styles, { level: 9 }).byteLength;
const declarationBlocks = styles.match(/\{/gu)?.length ?? 0;
const styleBudget = {
    rawBytes: 200 * 1024,
    gzipBytes: 32 * 1024,
    declarationBlocks: 1200,
};
const exceeded = [
    styleBytes > styleBudget.rawBytes &&
        `raw size ${styleBytes} > ${styleBudget.rawBytes} bytes`,
    gzipBytes > styleBudget.gzipBytes &&
        `gzip size ${gzipBytes} > ${styleBudget.gzipBytes} bytes`,
    declarationBlocks > styleBudget.declarationBlocks &&
        `declaration blocks ${declarationBlocks} > ${styleBudget.declarationBlocks}`,
].filter(Boolean);
if (exceeded.length > 0) {
    console.error(
        `Published aggregate CSS exceeds its reviewed budget:\n- ${exceeded.join('\n- ')}\n` +
            'Reduce the payload or update the budget with measured consumer evidence.',
    );
    process.exit(1);
}

console.log(
    `Package archive notices/assets are complete and aggregate CSS is within budget ` +
        `(${styleBytes} raw bytes, ${gzipBytes} gzip bytes, ${declarationBlocks} blocks): ` +
        normalizedArchive,
);
