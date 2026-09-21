// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
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
    'package/dist/esm/schemas/ui-adapter.schema.d.ts',
    'package/dist/esm/renderer/index.js',
    'package/dist/esm/renderer/index.d.ts',
    'package/dist/esm/renderer/builtin/index.js',
    'package/dist/esm/renderer/builtin/index.d.ts',
    'package/CONFORMANCE.md',
    'package/compat-manifest.json',
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

const repositoryManifestPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'compat-manifest.json',
);
const packedCompatibilityBytes = packedEntries.get('package/compat-manifest.json');
const repositoryCompatibilityBytes = readFileSync(repositoryManifestPath);
if (!packedCompatibilityBytes.equals(repositoryCompatibilityBytes)) {
    console.error(
        'Packed compatibility manifest is not byte-identical to the generated root contract.',
    );
    process.exit(1);
}
let compatibilityManifest;
try {
    compatibilityManifest = JSON.parse(packedCompatibilityBytes.toString('utf8'));
} catch (error) {
    console.error(
        `Packed compatibility manifest is invalid JSON: ${error instanceof Error ? error.message : String(error)}.`,
    );
    process.exit(1);
}
let packedPackage;
try {
    packedPackage = JSON.parse(readPackedText('package/package.json'));
} catch (error) {
    console.error(
        `Packed package.json is invalid: ${error instanceof Error ? error.message : String(error)}.`,
    );
    process.exit(1);
}
const coreEntry = compatibilityManifest.packages?.find(
    ({ name }) => name === '@cratis/components',
);
if (
    compatibilityManifest.schemaVersion !== 2 ||
    compatibilityManifest.releaseStatus !== 'publication-authorized' ||
    compatibilityManifest.publicationEnabled !== true ||
    compatibilityManifest.gaScope?.publicPackages?.length !== 7 ||
    coreEntry?.version !== packedPackage.version ||
    !semver.satisfies(packedPackage.version, coreEntry?.releaseMajorRange ?? '')
) {
    console.error(
        'Packed compatibility manifest contains invalid or stale Core release metadata.',
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
// One sentence of ErrorBoundary's own TSDoc. Update it with that prose; the assertion exists to
// prove declaration emit keeps documentation that the runtime bundle strips.
const apiDocMarker = 'Isolates descendant render/lifecycle errors behind a safe message';
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

// Every stylesheet subpath the packed manifest promises must actually be in the archive. Derived
// from the packed `exports` map rather than a list kept here, so a new per-area entry point cannot
// be declared without shipping its file - and cannot ship without getting a budget below.
const packedStyleExports = new Map(
    Object.entries(packedPackage.exports ?? {})
        .filter(([, target]) => typeof target === 'string' && target.endsWith('.css'))
        .map(([subpath, target]) => [subpath, `package/${target.replace(/^\.\//u, '')}`]),
);
const missingStyleExports = [...packedStyleExports]
    .filter(([, entry]) => !entries.has(entry))
    .map(([subpath, entry]) => `${subpath} -> ${entry}`);
if (missingStyleExports.length > 0) {
    console.error(
        `Package archive declares stylesheet exports it does not ship:\n- ${missingStyleExports.join('\n- ')}`,
    );
    process.exit(1);
}

const styleBytes = Buffer.byteLength(styles);
const gzipBytes = gzipSync(styles, { level: 9 }).byteLength;
const declarationBlocks = styles.match(/\{/gu)?.length ?? 0;
// Measured on the packed archive when NumberInput's stylesheet joined the aggregate: raw 206197,
// gzip 31747, 1152 declaration blocks. Raw moved past 200 KiB, so it was raised to 204 KiB against
// that measurement. Measured again when ComboBox's stylesheet joined: raw 209017, gzip 32022,
// 1169 declaration blocks — gzip, the size a consumer transfers, stays under its ceiling, and the
// duplicated narrow-width stepper block in NumberInput.css was merged, so only the raw ceiling moves,
// to 205 KiB. The gzip ceiling is not raised; the next stylesheet has to come with a reduction.
// That reduction came with Dialog placement: PivotViewer.css shipped 45 rules byte-identical to
// FilterPanel.css in the same aggregate, and dropping them measured raw 202877, gzip 31794,
// 1137 declaration blocks. The ceilings stay where they are.
// Measured again when the per-area entry points landed (Cratis/Components#301): raw 208162,
// gzip 32630, 1168 declaration blocks. The only aggregate change is the manifest header comment
// that documents the split, so the ceilings stay where they are once more - and the rule they
// encode is no longer the only lever, because a consumer that does not want every surface can now
// import the areas it mounts instead of raising this ceiling.
const styleBudget = {
    rawBytes: 205 * 1024,
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

// Per-area budgets (Cratis/Components#301).
//
// The aggregate ceiling above answers "how big may the whole library's CSS be". It cannot answer
// the question that actually matters to an application - "how much CSS does *this* app download" -
// and trying to make it do both is what turned a 22 KiB PivotViewer stylesheet into an argument
// about whether PivotViewer may have rules at all. A per-area ceiling asks the right question per
// entry point: a consumer that mounts a pivot viewer pays for PivotViewer, and a consumer that
// mounts a dialog does not.
//
// Budgeted in gzip only, deliberately. Every per-area sheet is a subset of the aggregate by
// construction (same manifest, same files, same order), so the aggregate's raw and
// declaration-block ceilings already bound each of them; gzip is the one number that describes
// what a consumer actually transfers, and it is the number that differs per area.
//
// Each ceiling is the measured gzip size rounded up to the next 512-byte boundary with at least
// 512 bytes of headroom, so ordinary authoring inside an area does not trip a gate while a step
// change does. Every per-area stylesheet in the archive must appear here and vice versa: a new
// area cannot ship without a reviewed, measured number.
const areaStyleBudgets = new Map([
    ['styles.base.css', 2560], // measured 2039
    ['styles.Canvas.css', 14336], // measured 13702
    ['styles.Chat.css', 6656], // measured 5864
    ['styles.CommandDialog.css', 7680], // measured 7013
    ['styles.CommandForm.css', 7168], // measured 6323
    ['styles.CommandStepper.css', 7168], // measured 6244
    ['styles.Common.css', 5632], // measured 4987
    ['styles.DataPage.css', 8192], // measured 7217
    ['styles.DataTables.css', 7168], // measured 6283
    ['styles.Dialogs.css', 7168], // measured 6582
    ['styles.Display.css', 6144], // measured 5398
    ['styles.Dropdown.css', 6144], // measured 5481
    ['styles.Filter.css', 3584], // measured 2742
    ['styles.Notifications.css', 5632], // measured 4988
    ['styles.ObjectContentEditor.css', 5632], // measured 5049
    ['styles.ObjectNavigationalBar.css', 5120], // measured 4576
    ['styles.PivotViewer.css', 7680], // measured 6840
    ['styles.renderer.builtin.css', 8704], // measured 7987
    ['styles.SchemaEditor.css', 8192], // measured 7417
    ['styles.TimeMachine.css', 5120], // measured 4440
    ['styles.Toolbar.css', 8192], // measured 7307
]);

// Self-contained sheets repeat the areas they share, so the emitted set is larger than the sum of
// the component stylesheets. That repetition is the price of "one import per subpath, no hidden
// prerequisites", and this ceiling is what keeps it from growing unreviewed. Measured 885940 raw
// bytes across 21 sheets when the split landed; the archive itself compresses the repetition away.
const areaStyleTotalRawBudget = 960 * 1024;

const packedAreaStyles = [...entries]
    .filter((entry) => /^package\/dist\/esm\/styles\..+\.css$/u.test(entry))
    .sort();
const areaProblems = [];
let areaRawTotal = 0;
const measuredAreaStyles = [];

for (const entry of packedAreaStyles) {
    const name = entry.slice('package/dist/esm/'.length);
    const content = readPackedText(entry);
    const budget = areaStyleBudgets.get(name);
    const measuredGzip = gzipSync(content, { level: 9 }).byteLength;
    areaRawTotal += Buffer.byteLength(content);
    measuredAreaStyles.push({ name, measuredGzip });

    if (budget === undefined) {
        areaProblems.push(
            `${name} ships without a reviewed budget (measured ${measuredGzip} gzip bytes)`,
        );
        continue;
    }
    if (measuredGzip > budget) {
        areaProblems.push(`${name} gzip size ${measuredGzip} > ${budget} bytes`);
    }
    // The split only pays for itself while an area is meaningfully smaller than taking everything.
    if (name !== 'styles.base.css' && measuredGzip >= gzipBytes) {
        areaProblems.push(
            `${name} gzip size ${measuredGzip} is not smaller than the aggregate's ${gzipBytes}`,
        );
    }
}

for (const name of areaStyleBudgets.keys()) {
    if (!entries.has(`package/dist/esm/${name}`)) {
        areaProblems.push(`${name} has a budget but is not in the archive`);
    }
}
if (areaRawTotal > areaStyleTotalRawBudget) {
    areaProblems.push(
        `per-area stylesheets total ${areaRawTotal} raw bytes > ${areaStyleTotalRawBudget}`,
    );
}
if (areaProblems.length > 0) {
    console.error(
        `Published per-area CSS does not match its reviewed budgets:\n- ${areaProblems.join('\n- ')}\n` +
            'Reduce the payload or update the budget with measured consumer evidence.',
    );
    process.exit(1);
}

console.log(
    `Package archive notices/assets are complete and aggregate CSS is within budget ` +
        `(${styleBytes} raw bytes, ${gzipBytes} gzip bytes, ${declarationBlocks} blocks): ` +
        normalizedArchive,
);
console.log(
    `${measuredAreaStyles.length} per-area stylesheet(s) within budget ` +
        `(${areaRawTotal} raw bytes total): ` +
        measuredAreaStyles
            .map(({ name, measuredGzip }) => `${name} ${measuredGzip}`)
            .join(', '),
);
