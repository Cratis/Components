// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CanvasItemRegistryEntry } from './CanvasItemRegistryEntry';

/** Registry contract used by {@link CanvasItem} to publish measured bounds. */
export interface CanvasItemRegistryContextValue {
    /** Adds or updates one measured item. */
    register: (id: string, entry: CanvasItemRegistryEntry) => void;
    /** Removes one measured item. */
    unregister: (id: string) => void;

    /**
     * The registry's current content, as a stable-reference snapshot: the returned map's identity only
     * changes when the content actually changed (an item registered, unregistered, or moved/resized),
     * making it safe to feed straight into `useSyncExternalStore`. The map is rebuilt on change — never
     * mutated in place — so a held snapshot stays internally consistent. Optional so a consumer
     * providing its own registry value predating this member keeps type-checking; readers must
     * fall back gracefully when absent.
     */
    getSnapshot?: () => ReadonlyMap<string, CanvasItemRegistryEntry>;

    /**
     * Subscribes to registry changes; the listener fires after every register/unregister/bounds-update
     * that actually changed content. Bounds updates can arrive per-frame during a drag — listeners
     * decide how much work to do per notification. Returns the unsubscribe function.
     * `useSyncExternalStore`-compatible. Optional for the same compatibility reason as
     * {@link getSnapshot}.
     */
    subscribe?: (listener: () => void) => () => void;
}
