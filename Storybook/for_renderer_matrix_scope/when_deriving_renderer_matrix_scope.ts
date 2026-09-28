// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import expectedStorybook from '../scripts/storybook-inventory.json';
import { computeRendererMatrixScope, findSlotOwningModules } from '../scripts/lib/renderer-matrix-scope.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const sourceRoot = path.join(repositoryRoot, 'Source');

const expectSlotOwningModulesToMatchInventory = (
    slotOwningModules: ReadonlySet<string>,
    root: string,
    expectedModules: readonly string[],
) => {
    expect(slotOwningModules.size).to.be.greaterThan(0);
    expect([...slotOwningModules]
        .map(file => path.relative(root, file).split(path.sep).join('/'))
        .sort()).to.deep.equal([...expectedModules].sort());
};

const storyEntry = (id: string, relativeComponentOrStoryFile: string, componentIsKnown = true) => ({
    id,
    componentPath: componentIsKnown ? `./Source/${relativeComponentOrStoryFile}` : undefined,
    importPath: `./Source/${relativeComponentOrStoryFile}`,
});

describe('when deriving renderer matrix scope', () => {
    // A regex rotting silently (for example after `unstable_useSlot` is renamed) would make the
    // registry empty and quietly send every story down the built-in-only path. Compare module
    // identities with the committed inventory and retain the presentation-profile membership guard.
    it('should match the reviewed slot-owning module inventory and nine-slot presentation profile', () => {
        const slotOwningModules = findSlotOwningModules(sourceRoot);
        expectSlotOwningModulesToMatchInventory(slotOwningModules, repositoryRoot, expectedStorybook.slotOwningModules);
        for (const presentationSlotFile of [
            'Common/Button.tsx',
            'Common/IconButton.tsx',
            'Common/TextInput.tsx',
            'Common/TextArea.tsx',
            'Common/Checkbox.tsx',
            'Common/Radio.tsx',
            'Common/Switch.tsx',
            'Display/ProgressBar.tsx',
            'Common/Surface.tsx',
        ]) {
            expect(
                [...slotOwningModules].some(file => file.endsWith(path.join(...presentationSlotFile.split('/')))),
                `expected ${presentationSlotFile} to own a renderer slot`,
            ).to.equal(true);
        }
    });

    it('should detect a new slot owner even when it replaces an existing owner without changing the count', () => {
        const root = mkdtempSync(path.join(os.tmpdir(), 'cratis-slot-inventory-'));
        try {
            const fixtureSourceRoot = path.join(root, 'Source');
            mkdirSync(path.join(fixtureSourceRoot, 'Common'), { recursive: true });
            const original = path.join(fixtureSourceRoot, 'Common/Original.tsx');
            const replacement = path.join(fixtureSourceRoot, 'Common/NewSlot.tsx');
            writeFileSync(original, "unstable_useSlot('common.original');\n");
            const snapshot = ['Source/Common/Original.tsx'];
            const before = findSlotOwningModules(fixtureSourceRoot);
            expectSlotOwningModulesToMatchInventory(before, root, snapshot);

            rmSync(original);
            writeFileSync(replacement, "unstable_useSlot('common.new');\n");
            const after = findSlotOwningModules(fixtureSourceRoot);
            expect(after.size).to.equal(before.size);
            expect(() => expectSlotOwningModulesToMatchInventory(after, root, snapshot)).to.throw();
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('should keep built-in-only components out of the renderer matrix', () => {
        const storyEntries = [
            storyEntry('common-combobox--playground', 'Common/ComboBox.tsx'),
            storyEntry('common-togglegroup--playground', 'Common/ToggleGroup.tsx'),
            storyEntry('common-tabs--playground', 'Common/Tabs.tsx'),
            storyEntry('common-taggroup--playground', 'Common/TagGroup.tsx'),
            storyEntry('common-breadcrumbs--playground', 'Common/Breadcrumbs.tsx'),
        ];
        const { matrixStoryIds } = computeRendererMatrixScope({ storyEntries, repositoryRoot, sourceRoot });
        expect(matrixStoryIds.size).to.equal(0);
    });

    it('should include composites that render a slotted primitive inside them', () => {
        const storyEntries = [
            storyEntry('commanddialog-commanddialog--default', 'CommandDialog/CommandDialog.tsx'),
            storyEntry('datapage-datapage--default', 'DataPage/DataPage.tsx'),
            storyEntry('datatables-columnfiltermenu--default', 'DataTables/ColumnFilterMenu.tsx'),
            storyEntry('schemaeditor-schemaeditor--default', 'SchemaEditor/SchemaEditor.tsx'),
        ];
        const { matrixStoryIds } = computeRendererMatrixScope({ storyEntries, repositoryRoot, sourceRoot });
        expect(matrixStoryIds.size).to.equal(storyEntries.length);
    });

    it('should include a story with no declared component, falling back to the story module itself', () => {
        const storyEntries = [
            storyEntry('display-overview--overview', 'Display/Display.stories.tsx', false),
        ];
        const { matrixStoryIds } = computeRendererMatrixScope({ storyEntries, repositoryRoot, sourceRoot });
        expect(matrixStoryIds.size).to.equal(1);
    });

    it('should not credit an unrelated sibling import with a slot-owning neighbor\'s reachability', () => {
        // Regression test for a defect in an earlier revision of this derivation: a DFS that broke
        // as soon as it found a slot-owning module memoized every file visited so far — including
        // sibling imports that do not themselves reach a slot — as matrix-worthy. Two components
        // fanning out from one story file, only one of which reaches a slot, must be judged
        // independently regardless of import order or traversal shortcuts.
        const root = mkdtempSync(path.join(os.tmpdir(), 'cratis-renderer-matrix-scope-'));
        try {
            const fixtureSourceRoot = path.join(root, 'Source');
            mkdirSync(path.join(fixtureSourceRoot, 'Common'), { recursive: true });
            writeFileSync(
                path.join(fixtureSourceRoot, 'Common/SlottedButton.tsx'),
                "export const SlottedButton = () => { unstable_useSlot('common.button'); };\n",
            );
            writeFileSync(
                path.join(fixtureSourceRoot, 'Common/PlainLabel.tsx'),
                'export const PlainLabel = () => null;\n',
            );
            writeFileSync(
                path.join(fixtureSourceRoot, 'Common/Overview.stories.tsx'),
                "import { PlainLabel } from './PlainLabel';\nimport { SlottedButton } from './SlottedButton';\nexport default { title: 'Overview' };\n",
            );
            const storyEntries = [
                { id: 'overview--all', importPath: './Source/Common/Overview.stories.tsx' },
                { id: 'plain-label--only', componentPath: './Source/Common/PlainLabel.tsx', importPath: './Source/Common/PlainLabel.stories.tsx' },
            ];
            const { matrixStoryIds } = computeRendererMatrixScope({
                storyEntries,
                repositoryRoot: root,
                sourceRoot: fixtureSourceRoot,
            });
            expect(matrixStoryIds.has('overview--all')).to.equal(true);
            expect(matrixStoryIds.has('plain-label--only')).to.equal(false);
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
