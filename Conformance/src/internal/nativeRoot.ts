// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SlotProfile } from './SlotProfile.js';

/** The native root a mounted slot fixture rendered, and the parts the platform owns there. */
export interface NativeRoot {
    readonly element: Element | null;
    readonly tagMatches: boolean;
    readonly platformOwnedParts: readonly string[];
}

const query = (document: Document, container: ParentNode, selector: string) =>
    container.querySelector(selector) ?? document.querySelector(selector);

/**
 * Finds the native root of a mounted fixture: the profile's own element, or else its platform
 * stand-in (such as a modal `<dialog>`), whose platform-owned parts may then be absent.
 *
 * @param profile Slot profile under test.
 * @param document Document the fixture is mounted in.
 * @param container Container of the mounted fixture.
 * @returns The native root, whether its tag matches the contract, and the platform-owned parts.
 */
export const findNativeRoot = (
    profile: SlotProfile,
    document: Document,
    container: ParentNode,
): NativeRoot => {
    const element = query(document, container, profile.nativeSelector);
    if (element || !profile.platformRoot)
        return { element, tagMatches: element?.tagName === profile.nativeTag, platformOwnedParts: [] };
    const { selector, tag, ownedParts } = profile.platformRoot;
    const platformElement = query(document, container, selector);
    return {
        element: platformElement,
        tagMatches: platformElement?.tagName === tag,
        platformOwnedParts: platformElement ? ownedParts : [],
    };
};

/**
 * Lists the parts a fixture may omit: the profile's conditionally absent parts plus the parts the
 * platform owns for the rendered native root.
 *
 * @param profile Slot profile under test.
 * @param root Native root of the mounted fixture.
 * @returns The parts the part and pass-through checks skip.
 */
export const absentPartsOf = (profile: SlotProfile, root: NativeRoot): readonly string[] => [
    ...(profile.conditionallyAbsentParts ?? []),
    ...root.platformOwnedParts,
];
