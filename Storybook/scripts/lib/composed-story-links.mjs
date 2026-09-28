// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Select a real story from the reviewed inventory; never link to the manager placeholder. */
export const selectLinkStory = inventory => {
    const storyId = inventory.stories?.find(id => id.startsWith('common-button--'));
    if (!storyId) {
        throw new Error('No Common/Button story remains in the committed Storybook inventory; update the link verification and documentation.');
    }
    return storyId;
};

export const managerStoryPath = (refId, storyId, embed = false) =>
    `/?path=/story/${refId}_${storyId}${embed ? '&embed=1' : ''}`;

export const previewStoryPath = (refId, storyId) =>
    `/renderers/${refId}/iframe.html?id=${storyId}`;
