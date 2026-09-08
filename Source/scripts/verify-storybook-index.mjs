// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(sourceRoot, process.argv[2] ?? 'storybook-static');
const indexPath = path.join(output, 'index.json');

const fail = (message) => {
    console.error(`verify-storybook-index: ${message}`);
    process.exit(1);
};

const collectStoryFiles = (directory) => {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (['dist', 'node_modules', 'storybook-static'].includes(entry.name)) continue;
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...collectStoryFiles(entryPath));
        else if (entry.isFile() && /\.stories\.(?:ts|tsx)$/u.test(entry.name)) {
            files.push(
                `./${path.relative(sourceRoot, entryPath).split(path.sep).join('/')}`,
            );
        }
    }
    return files;
};

if (!existsSync(indexPath)) fail(`missing ${indexPath}; build Storybook first.`);
let index;
try {
    index = JSON.parse(readFileSync(indexPath, 'utf8'));
} catch (error) {
    fail(error instanceof Error ? error.message : String(error));
}

const entries = Object.values(index.entries ?? {});
const storyEntries = entries.filter((entry) => entry.type === 'story');
const docsEntries = entries.filter((entry) => entry.type === 'docs');
const storyFiles = collectStoryFiles(sourceRoot);
const countByImportPath = (selectedEntries) => {
    const counts = new Map();
    for (const entry of selectedEntries) {
        counts.set(entry.importPath, (counts.get(entry.importPath) ?? 0) + 1);
    }
    return counts;
};
const storyCounts = countByImportPath(storyEntries);
const docsCounts = countByImportPath(docsEntries);

if (storyEntries.length === 0) fail('no stories were indexed.');

const missingStories = storyFiles.filter((file) => !storyCounts.has(file));
const invalidDocs = storyFiles.filter((file) => docsCounts.get(file) !== 1);
const unknownModules = [...new Set([...storyCounts.keys(), ...docsCounts.keys()])].filter(
    (file) => !storyFiles.includes(file),
);
if (missingStories.length || invalidDocs.length || unknownModules.length) {
    const details = [
        missingStories.length
            ? `modules without stories: ${missingStories.join(', ')}`
            : '',
        invalidDocs.length
            ? `modules without exactly one autodocs page: ${invalidDocs
                  .map((file) => `${file} (${docsCounts.get(file) ?? 0})`)
                  .join(', ')}`
            : '',
        unknownModules.length
            ? `indexed unknown modules: ${unknownModules.join(', ')}`
            : '',
    ].filter(Boolean);
    fail(details.join('; '));
}

console.log(
    `Storybook index verified: ${storyEntries.length} stories and ${docsEntries.length} autodocs pages ` +
        `from ${storyFiles.length} story files.`,
);
