// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    describeStoryExclusions,
    rendererStoryExclusions,
    storyExclusionsFor,
} from '../scripts/lib/renderer-story-exclusions.mjs';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../Source');

const adapter = (id: string, slots?: readonly string[], builtIn = false) => ({ builtIn, metadata: { id, slots } });

const storyFilesUsingTag = (tag: string) =>
    readdirSync(sourceRoot, { recursive: true, encoding: 'utf8' })
        .filter(file => file.endsWith('.stories.tsx'))
        .filter(file => readFileSync(path.join(sourceRoot, file), 'utf8').includes(`'${tag}'`));

describe('when resolving renderer story exclusions', () => {
    it('should skip built-in dialog shell stories for an adapter that implements the dialog slot', () => {
        const tags = storyExclusionsFor(adapter('native', ['dialogs.dialog', 'overlays.popover'])).map(exclusion => exclusion.tag);
        expect(tags).to.deep.equal(['built-in-dialog-shell']);
    });

    it('should skip nothing for an adapter that keeps the built-in dialog slot', () => {
        expect(storyExclusionsFor(adapter('keeps-built-in', ['overlays.popover']))).to.deep.equal([]);
    });

    it('should skip nothing for an adapter that declares no slots', () => {
        expect(storyExclusionsFor(adapter('no-slots'))).to.deep.equal([]);
    });

    // The built-in adapter declares the dialog slot because it is the implementation the stories assert.
    it('should skip nothing for the built-in adapter that declares the dialog slot', () => {
        expect(storyExclusionsFor(adapter('built-in', ['dialogs.dialog'], true))).to.deep.equal([]);
    });

    it('should name the adapter, tag and reason in the verification log', () => {
        const description = describeStoryExclusions([adapter('built-in', ['dialogs.dialog'], true), adapter('native', ['dialogs.dialog'])]);
        expect(description).to.contain("native skips stories tagged 'built-in-dialog-shell'");
        expect(description).to.contain(rendererStoryExclusions[0].reason);
        expect(description).not.to.contain('built-in skips');
    });

    it('should describe no exclusions as none', () => {
        expect(describeStoryExclusions([adapter('built-in', ['dialogs.dialog'], true)])).to.equal('none');
    });

    // An exclusion tag no story carries is a stale entry; one carried by a renamed tag would stop excluding.
    it('should have every exclusion tag carried by at least one story', () => {
        for (const exclusion of rendererStoryExclusions) {
            expect(storyFilesUsingTag(exclusion.tag), exclusion.tag).to.not.be.empty;
        }
    });
});
