// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import type { unstable_SlotId } from '@cratis/components/renderer';
import type { CratisPartsManifest } from '@cratis/components/types';

/** A platform element that may stand in for a slot's native root. */
export interface PlatformRoot {
    readonly selector: string;
    readonly tag: string;
    readonly ownedParts: readonly string[];
}

/** Who owns which part of a stable atomic slot's behavior, as published on the contract page. */
export interface SlotOwnership {
    /** What Components keeps for the slot. */
    readonly core: readonly string[];
    /** What an adapter that implements the slot owns. */
    readonly adapter: readonly string[];
}

/** Observations of keyboard, focus and dismissal behavior; a key is present only when the slot has that concern. */
export interface SlotInteractionResult {
    readonly keyboard?: boolean;
    readonly focus?: boolean;
    readonly dismissal?: boolean;
    /** Raw observations that explain the outcome, attached to every check as evidence. */
    readonly detail?: Readonly<Record<string, unknown>>;
    /** Observations that only settle after the interaction scope has ended, such as renderer state flushed on exit. */
    readonly settled?: () => Promise<Pick<SlotInteractionResult, 'keyboard' | 'focus' | 'dismissal'>>;
}

/** Drives a mounted slot with dispatched keyboard and focus events and reports what happened. */
export type SlotInteraction = (document: Document, container: HTMLElement) => Promise<SlotInteractionResult>;

/** Internal fixture for one public renderer slot. */
export interface SlotProfile {
    readonly slotId: unstable_SlotId;
    /** Public props type of a stable atomic slot, for the generated contract page. */
    readonly propsType?: string;
    /** Core-versus-adapter ownership of a stable atomic slot, for the generated contract page. */
    readonly ownership?: SlotOwnership;
    readonly partsKey: keyof CratisPartsManifest;
    readonly createProps: () => Readonly<Record<string, unknown>>;
    readonly createStateProps?: () => Readonly<Record<string, unknown>>;
    readonly createPartVariants?: () => readonly Readonly<Record<string, unknown>>[];
    readonly conditionallyAbsentParts?: readonly string[];
    readonly ptKeys: readonly string[];
    readonly nativeSelector: string;
    readonly nativeTag: string;
    /**
     * A platform element that may stand in for the native root, such as a modal `<dialog>` in the
     * browser top layer, and the parts the platform then owns (for example its `::backdrop`).
     */
    readonly platformRoot?: PlatformRoot;
    readonly refCapable: boolean;
    readonly ownershipSelectors: readonly string[];
    readonly activate?: (document: Document, container: HTMLElement) => Promise<void>;
    /** Keyboard, focus and dismissal observations, run against a fresh fixture of an atomic slot. */
    readonly interact?: SlotInteraction;
    readonly exercise?: (
        document: Document,
        container: HTMLElement,
        ref: RefObject<Element | null>,
    ) => Promise<Readonly<Record<string, unknown>>>;
}
