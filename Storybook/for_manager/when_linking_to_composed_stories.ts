// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import inventory from '../scripts/storybook-inventory.json';
import { managerStoryPath, previewStoryPath, selectLinkStory } from '../scripts/lib/composed-story-links.mjs';

describe('when linking to composed stories', () => {
    it('should select a real component story from the committed inventory', () => {
        const storyId = selectLinkStory(inventory);
        expect(inventory.stories).to.include(storyId);
        expect(storyId.startsWith('common-button--')).to.equal(true);
    });

    it('should fail clearly when the component story is removed or renamed', () => {
        expect(() => selectLinkStory({ stories: ['internal-composition-manager--placeholder'] }))
            .to.throw('No Common/Button story remains in the committed Storybook inventory');
    });

    it('should build prefixed manager and renderer preview URLs for the indexed story', () => {
        const storyId = selectLinkStory(inventory);
        expect(managerStoryPath('cratis-built-in', storyId))
            .to.equal(`/?path=/story/cratis-built-in_${storyId}`);
        expect(managerStoryPath('cratis-mui', storyId, true))
            .to.equal(`/?path=/story/cratis-mui_${storyId}&embed=1`);
        expect(previewStoryPath('cratis-mui', storyId))
            .to.equal(`/renderers/cratis-mui/iframe.html?id=${storyId}`);
    });
});
