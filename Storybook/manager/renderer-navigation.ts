// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComposedRef } from 'storybook/manager-api';

export interface RendererSelection {
    readonly refId: string;
    readonly storyId: string;
    readonly viewMode: string;
    readonly preserved: boolean;
}

/** Removes Storybook Composition's ref prefix from the manager's selected story id. */
export const canonicalRendererStoryId = (storyId: string, refId: string | undefined) =>
    refId && storyId.startsWith(`${refId}_`) ? storyId.slice(refId.length + 1) : storyId;

/** Selects the same stable story id in another composed renderer when its index contains it. */
export const resolveRendererSelection = (
    storyId: string,
    viewMode: string,
    targetRefId: string,
    target: ComposedRef | undefined,
): RendererSelection | undefined => {
    if (!target) return undefined;
    if (!target.index) {
        return { refId: targetRefId, storyId, viewMode, preserved: true };
    }
    const current = target.index[storyId];
    if (current && (current.type === 'story' || current.type === 'docs')) {
        return { refId: targetRefId, storyId, viewMode, preserved: true };
    }
    const requestedType = viewMode === 'docs' ? 'docs' : 'story';
    const fallback =
        Object.values(target.index).find((entry) => entry.type === requestedType) ??
        Object.values(target.index).find((entry) => entry.type === 'story');
    if (!fallback) return undefined;
    return {
        refId: targetRefId,
        storyId: fallback.id,
        viewMode: fallback.type === 'docs' ? 'docs' : 'story',
        preserved: false,
    };
};
