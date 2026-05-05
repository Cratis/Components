// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, ReactNode, useCallback, useContext, useEffect, useId, useLayoutEffect, useState, useSyncExternalStore } from 'react';

interface SlotEntry {
    content: ReactNode;
    order: number;
}

type Subscriber = () => void;

/** Stable empty snapshot returned when a slot name has no registered content. */
const _emptySnapshot: ReactNode[] = [];

/**
 * Registry for named toolbar slot entries.
 * Maintained outside React state so slot registrations never re-render the provider.
 */
class ToolbarSlotRegistry {
    private readonly _slots = new Map<string, Map<string, SlotEntry>>();
    private readonly _snapshots = new Map<string, ReactNode[]>();
    private readonly _subscribers = new Set<Subscriber>();

    /**
     * Register or update a slot entry.
     * Notifies subscribers only when the content reference or order actually changes.
     */
    register(slotName: string, id: string, content: ReactNode, order: number): void {
        if (!this._slots.has(slotName)) {
            this._slots.set(slotName, new Map());
        }
        const slotMap = this._slots.get(slotName)!;
        const previous = slotMap.get(id);
        if (previous?.content === content && previous?.order === order) return;
        slotMap.set(id, { content, order });
        this._recompute(slotName);
        this._notify();
    }

    /** Remove a slot entry and notify subscribers. */
    unregister(slotName: string, id: string): void {
        const slotMap = this._slots.get(slotName);
        if (!slotMap?.has(id)) return;
        slotMap.delete(id);
        this._recompute(slotName);
        this._notify();
    }

    /** Subscribe to any slot change. Returns an unsubscribe function. */
    subscribe(fn: Subscriber): () => void {
        this._subscribers.add(fn);
        return () => this._subscribers.delete(fn);
    }

    /**
     * Returns a stable snapshot of sorted slot contents for the given slot name.
     * The reference only changes when the slot set actually changes.
     */
    getSnapshot(slotName: string): ReactNode[] {
        return this._snapshots.get(slotName) ?? _emptySnapshot;
    }

    private _recompute(slotName: string): void {
        const slotMap = this._slots.get(slotName);
        if (!slotMap || slotMap.size === 0) {
            this._snapshots.delete(slotName);
            return;
        }
        this._snapshots.set(
            slotName,
            [...slotMap.values()]
                .sort((a, b) => a.order - b.order)
                .map(entry => entry.content)
        );
    }

    private _notify(): void {
        this._subscribers.forEach(fn => fn());
    }
}

const ToolbarSlotContext = createContext<ToolbarSlotRegistry | null>(null);

/** Props for the {@link ToolbarSlotProvider} component. */
export interface ToolbarSlotProviderProps {
    /**
     * The subtree that contains both toolbar slot consumers ({@link ToolbarGroup},
     * {@link ToolbarContext}) and slot producers ({@link ToolbarSlot}).
     */
    children: ReactNode;
}

/**
 * Provides the toolbar slot registry to the component tree.
 *
 * Mount once above both the toolbar and the components that fill slots.
 * Each provider creates an isolated registry — nesting providers creates isolated scopes.
 */
export const ToolbarSlotProvider = ({ children }: ToolbarSlotProviderProps) => {
    const [registry] = useState(() => new ToolbarSlotRegistry());
    return <ToolbarSlotContext.Provider value={registry}>{children}</ToolbarSlotContext.Provider>;
};

/**
 * Returns the sorted slot contents for a given `slotName` as a stable array.
 * Returns an empty array when no {@link ToolbarSlotProvider} is present or when the slot has no content.
 *
 * Suitable for direct use inside components that host a slot (e.g. {@link ToolbarGroup}).
 */
export const useToolbarSlot = (slotName: string): ReactNode[] => {
    const registry = useContext(ToolbarSlotContext);
    const subscribe = useCallback((fn: () => void) => {
        if (!registry) return () => { /* no-op unsubscribe when no registry is present */ };
        return registry.subscribe(fn);
    }, [registry]);
    const getSnapshot = useCallback(() => registry?.getSnapshot(slotName) ?? _emptySnapshot, [registry, slotName]);
    return useSyncExternalStore(subscribe, getSnapshot);
};

/** Props for the {@link ToolbarSlot} component. */
export interface ToolbarSlotProps {
    /**
     * The name of the destination slot.
     * Must match the `slotName` on a {@link ToolbarGroup} or {@link ToolbarContext}.
     */
    slotName: string;

    /**
     * Render order relative to other entries in the same slot.
     * Lower numbers appear first (default: `0`).
     */
    order?: number;

    /**
     * The toolbar content to teleport into the named slot.
     * Wrap in `useMemo` to keep the reference stable and avoid unnecessary re-renders.
     */
    children: ReactNode;
}

/**
 * Teleports its children into the named toolbar slot without prop drilling.
 * Renders nothing itself — place it anywhere inside a {@link ToolbarSlotProvider} tree.
 *
 * The nearest {@link ToolbarGroup} or {@link ToolbarContext} with a matching `slotName`
 * will render the content. Use {@link ToolbarSlotProps.order} to control position relative to
 * other {@link ToolbarSlot} entries in the same slot.
 *
 * @example
 * ```tsx
 * // In a feature component, inject a button into the 'canvas-tools' slot:
 * <ToolbarSlot slotName="canvas-tools" order={10}>
 *     <ToolbarButton icon="pi pi-star" title="Favorite" />
 * </ToolbarSlot>
 * ```
 */
export const ToolbarSlot = ({ slotName, order = 0, children }: ToolbarSlotProps) => {
    const id = useId();
    const registry = useContext(ToolbarSlotContext);

    // Re-register on every render so fresh closures are always captured.
    // The registry skips notification when the content reference hasn't changed.
    useLayoutEffect(() => {
        registry?.register(slotName, id, children, order);
    });

    useEffect(() => () => registry?.unregister(slotName, id), [id, registry, slotName]);

    return null;
};
