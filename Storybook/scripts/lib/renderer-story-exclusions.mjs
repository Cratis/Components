// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Story tags a renderer leg skips, each with the slot that makes the tagged stories meaningless
 * for it. A story carries the tag when it asserts the geometry of a built-in implementation, so
 * a renderer that replaces that slot with its own implementation cannot satisfy it. Every such
 * story still runs on the built-in renderer and on every renderer that keeps the built-in slot.
 */
export const rendererStoryExclusions = Object.freeze([
    Object.freeze({
        tag: 'built-in-dialog-shell',
        slot: 'dialogs.dialog',
        reason:
            "asserts the built-in dialog shell's geometry (the backdrop and positioner parts, the slide entrance, " +
            'a .cratis-dialog root, z-index stacking in a consumer overlay root); an adapter that implements ' +
            'dialogs.dialog renders its own shell, such as a native top-layer modal',
    }),
]);

/**
 * The exclusions that apply to a renderer adapter: those whose slot the adapter replaces. The
 * built-in adapter declares every built-in slot but replaces none, so it never skips a story.
 * @param {{ readonly builtIn: boolean; readonly metadata: { readonly slots?: readonly string[] } }} adapter The adapter inventory entry.
 * @returns {readonly { tag: string; slot: string; reason: string }[]} The applicable exclusions.
 */
export const storyExclusionsFor = adapter =>
    adapter.builtIn
        ? []
        : rendererStoryExclusions.filter(exclusion => adapter.metadata.slots?.includes(exclusion.slot) ?? false);

/**
 * Describes the story exclusions for every adapter in the inventory, for the verification logs.
 * @param {readonly { readonly builtIn: boolean; readonly metadata: { readonly id: string; readonly slots?: readonly string[] } }[]} adapters The adapters.
 * @returns {string} One line naming each excluded tag per adapter and why, or that there are none.
 */
export const describeStoryExclusions = adapters => {
    const lines = adapters.flatMap(adapter =>
        storyExclusionsFor(adapter).map(exclusion => `${adapter.metadata.id} skips stories tagged '${exclusion.tag}': ${exclusion.reason}`),
    );
    return lines.length === 0 ? 'none' : lines.join('; ');
};
