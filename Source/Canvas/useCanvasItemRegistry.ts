// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useMemo, useRef, useState } from 'react';
import type { MinimapItem } from './CanvasMinimap';
import type { CanvasItemRegistryContextValue } from './CanvasItemRegistryContextValue';
import type { CanvasItemRegistryEntry } from './CanvasItemRegistryEntry';

/**
 * The registry CanvasItem children publish their measured bounds to, with the minimap items
 * derived from it.
 * @returns The registry, its context value, and the derived minimap items.
 */
export const useCanvasItemRegistry = () => {
    const itemRegistryRef = useRef<Map<string, CanvasItemRegistryEntry>>(new Map());
    const [itemRegistryVersion, setItemRegistryVersion] = useState(0);

    // The read/subscribe side of the registry. The snapshot is a fresh shallow copy taken on every
    // actual content change (register/unregister guard against no-op writes below), so its identity
    // is a faithful change signal for useSyncExternalStore consumers — same reference back means
    // nothing changed. Entry objects are replaced wholesale on update, never mutated, so entries
    // shared between an old snapshot and a new one are safe to hold onto.
    const registrySnapshotRef = useRef<ReadonlyMap<string, CanvasItemRegistryEntry>>(
        new Map(),
    );
    const registryListenersRef = useRef<Set<() => void>>(new Set());

    const notifyRegistryChanged = useCallback(() => {
        registrySnapshotRef.current = new Map(itemRegistryRef.current);
        setItemRegistryVersion((version) => version + 1);
        registryListenersRef.current.forEach((listener) => listener());
    }, []);

    const registerItem = useCallback(
        (id: string, entry: CanvasItemRegistryEntry) => {
            const existing = itemRegistryRef.current.get(id);
            if (
                existing &&
                existing.x === entry.x &&
                existing.y === entry.y &&
                existing.width === entry.width &&
                existing.height === entry.height &&
                existing.anonymous === entry.anonymous
            )
                return;
            itemRegistryRef.current.set(id, entry);
            notifyRegistryChanged();
        },
        [notifyRegistryChanged],
    );

    const unregisterItem = useCallback(
        (id: string) => {
            if (!itemRegistryRef.current.delete(id)) return;
            notifyRegistryChanged();
        },
        [notifyRegistryChanged],
    );

    const getRegistrySnapshot = useCallback(
        (): ReadonlyMap<string, CanvasItemRegistryEntry> => registrySnapshotRef.current,
        [],
    );

    const subscribeToRegistry = useCallback((listener: () => void): (() => void) => {
        registryListenersRef.current.add(listener);
        return () => {
            registryListenersRef.current.delete(listener);
        };
    }, []);

    const registryContextValue = useMemo<CanvasItemRegistryContextValue>(
        () => ({
            register: registerItem,
            unregister: unregisterItem,
            getSnapshot: getRegistrySnapshot,
            subscribe: subscribeToRegistry,
        }),
        [registerItem, unregisterItem, getRegistrySnapshot, subscribeToRegistry],
    );

    const autoMinimapItems = useMemo((): MinimapItem[] => {
        void itemRegistryVersion; // subscribe to registry changes
        const result: MinimapItem[] = [];
        itemRegistryRef.current.forEach((entry) => {
            result.push({
                x: entry.x,
                y: entry.y,
                width: entry.width,
                height: entry.height,
            });
        });
        return result;
    }, [itemRegistryVersion]);

    return { itemRegistryRef, registryContextValue, autoMinimapItems };
};
