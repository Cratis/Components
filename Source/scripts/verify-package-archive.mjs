// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { readTarEntries } from './lib/packed-artifact.mjs';
import {
    assertExpectedCascadeLayerOrder,
    assertNoPrimeFamilyReferences,
} from './lib/release-package-guards.mjs';

const archive = process.argv[2];
if (!archive) {
    console.error('Usage: node scripts/verify-package-archive.mjs <package.tgz>');
    process.exit(1);
}

const normalizedArchive = path.resolve(archive);
const packedEntries = readTarEntries(normalizedArchive);
const entries = new Set(packedEntries.keys());
const readPackedText = (entry) => {
    const content = packedEntries.get(entry);
    if (!content) {
        console.error(`Package archive is missing '${entry}'.`);
        process.exit(1);
    }
    return content.toString('utf8');
};
const requiredEntries = [
    'package/LICENSE',
    'package/README.md',
    'package/MIGRATION.md',
    'package/THIRD_PARTY_NOTICES.md',
    'package/dist/esm/styles.css',
    'package/dist/esm/schemas/ui-adapter.schema.json',
    'package/dist/esm/renderer/index.js',
    'package/dist/esm/renderer/index.d.ts',
    'package/dist/esm/renderer/builtin/index.js',
    'package/dist/esm/renderer/builtin/index.d.ts',
    'package/CONFORMANCE.md',
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
const expectedFonts = new Set(
    requiredEntries.filter((entry) => /\.(?:otf|ttf|woff2?)$/iu.test(entry)),
);
const unexpectedFonts = [...entries].filter(
    (entry) => /\.(?:otf|ttf|woff2?)$/iu.test(entry) && !expectedFonts.has(entry),
);
if (unexpectedFonts.length > 0) {
    console.error(
        `Package archive contains undeclared font assets:\n- ${unexpectedFonts.join('\n- ')}`,
    );
    process.exit(1);
}

const verifyPackedMarkdownLinks = (entry) => {
    const markdown = readPackedText(entry);
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

const license = readPackedText('package/LICENSE');
if (!license.includes('MIT License') || !license.includes('Copyright (c) 2025 Cratis')) {
    console.error('Package LICENSE does not contain the expected Cratis MIT notice.');
    process.exit(1);
}

const notices = readPackedText('package/THIRD_PARTY_NOTICES.md');
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

try {
    assertNoPrimeFamilyReferences(packedEntries);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}

const declarationWithDocs = readPackedText('package/dist/esm/Common/ErrorBoundary.d.ts');
const declarationWithDeprecations = readPackedText(
    'package/dist/esm/Common/DatePickerInput.d.ts',
);
const runtimeWithoutDocs = readPackedText('package/dist/esm/Common/ErrorBoundary.js');
const apiDocMarker = 'React error boundary that catches errors thrown by its descendants';
if (!declarationWithDocs.includes(apiDocMarker)) {
    console.error('Published declarations stripped the ErrorBoundary TSDoc contract.');
    process.exit(1);
}
if (!declarationWithDeprecations.includes('@deprecated')) {
    console.error('Published declarations stripped @deprecated migration guidance.');
    process.exit(1);
}
if (runtimeWithoutDocs.includes(apiDocMarker)) {
    console.error('Published runtime JavaScript retained declaration-only TSDoc text.');
    process.exit(1);
}

const stylesEntry = 'package/dist/esm/styles.css';
const styles = readPackedText(stylesEntry);
try {
    assertExpectedCascadeLayerOrder(styles, stylesEntry);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
}

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
