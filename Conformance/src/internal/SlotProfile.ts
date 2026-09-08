// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import type { unstable_SlotId } from '@cratis/components/renderer';
import type { CratisPartsManifest } from '@cratis/components/types';

/** Internal fixture for one public renderer slot. */
export interface SlotProfile {
    readonly slotId: unstable_SlotId;
    readonly partsKey: keyof CratisPartsManifest;
    readonly createProps: () => Readonly<Record<string, unknown>>;
    readonly createStateProps?: () => Readonly<Record<string, unknown>>;
    readonly createPartVariants?: () => readonly Readonly<Record<string, unknown>>[];
    readonly conditionallyAbsentParts?: readonly string[];
    readonly ptKeys: readonly string[];
    readonly nativeSelector: string;
    readonly nativeTag: string;
    readonly refCapable: boolean;
    readonly ownershipSelectors: readonly string[];
    readonly activate?: (document: Document, container: HTMLElement) => Promise<void>;
    readonly exercise?: (
        document: Document,
        container: HTMLElement,
        ref: RefObject<Element | null>,
    ) => Promise<Readonly<Record<string, unknown>>>;
}
