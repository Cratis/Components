// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import { CanvasItemRegistryContext, type CanvasItemRegistryEntry } from '../../Canvas';
import { useOptionalMessenger } from '../../../Common/messaging/useOptionalMessenger';
import { ItemAddedToRegion } from './ItemAddedToRegion';
import { ItemRemovedFromRegion } from './ItemRemovedFromRegion';
import { itemsWithinRegion } from './regionContainment';
import type { RegionData } from './Region';

// Stable fallbacks also support registries predating getSnapshot/subscribe. Their identities must
// not change between renders, or useSyncExternalStore would resubscribe every time.
const EMPTY_REGISTRY: ReadonlyMap<string, CanvasItemRegistryEntry> = new Map();
const getEmptyRegistry = (): ReadonlyMap<string, CanvasItemRegistryEntry> => EMPTY_REGISTRY;
const subscribeToNothing = (): (() => void) => () => { /* nothing to unsubscribe */ };

export const useRegionMembership = (region: RegionData) => {
    const registry = useContext(CanvasItemRegistryContext);
    const publish = useOptionalMessenger();
    // Bounds updates can arrive per-frame; diffing publishes only membership changes. The third
    // argument supplies the empty snapshot during server rendering.
    const registrySnapshot = useSyncExternalStore(
        registry?.subscribe ?? subscribeToNothing,
        registry?.getSnapshot ?? getEmptyRegistry,
        getEmptyRegistry,
    );
    // Bookkeeping only: publishing a diff must not itself cause a render.
    const membershipRef = useRef<ReadonlySet<string>>(new Set());

    useEffect(() => {
        // With no messenger, skip containment math as well as publishing.
        if (!publish) return;
        const within = itemsWithinRegion(
            { x: region.x, y: region.y, width: region.width, height: region.height },
            registrySnapshot,
            region.id,
        );
        const current = new Set(within);
        const previous = membershipRef.current;
        current.forEach((itemId) => {
            if (!previous.has(itemId)) publish(new ItemAddedToRegion(region.id, itemId));
        });
        previous.forEach((itemId) => {
            if (!current.has(itemId)) publish(new ItemRemovedFromRegion(region.id, itemId));
        });
        membershipRef.current = current;
    }, [publish, registrySnapshot, region.id, region.x, region.y, region.width, region.height]);
};
