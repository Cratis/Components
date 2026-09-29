// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useCallback, useContext, useId, useSyncExternalStore, type FocusEvent, type Ref } from 'react';

/**
 * The single-Tab-stop state a toolbar shares with the tools it owns. Its identity is stable for
 * the toolbar's lifetime in that mode; tools subscribe to the active tool instead of re-rendering
 * with every focus change.
 */
export interface ToolbarRoving {
    /** The active tool's key, or null until the toolbar has chosen one. */
    getActiveKey(): string | null;
    /**
     * Whether a tool lies in the toolbar's own DOM scope. A tool rendered elsewhere, for example
     * through a portal or under a nested consumer toolbar, keeps its native Tab stop.
     */
    isInScope(key: string): boolean;
    /** Subscribes to changes of the active tool. */
    subscribe(listener: () => void): () => void;
    /** Records the element for a tool, or removes it when the element is null. */
    register(key: string, element: HTMLElement | null): void;
    /** Makes a tool the toolbar's single Tab stop. */
    activate(key: string): void;
}

/** Provided by a toolbar in single-Tab-stop mode; null in every other mode. */
export const ToolbarRovingContext = createContext<ToolbarRoving | null>(null);

/** The props a Components-owned tool spreads onto its focusable element. */
export interface RovingToolProps<TElement extends HTMLElement> {
    ref?: Ref<TElement>;
    tabIndex?: number;
    onFocus?: (event: FocusEvent<TElement>) => void;
}

const subscribeToNothing = () => () => undefined;
const unmanaged = 'unmanaged';
const undecided = 'undecided';
const active = 'active';
const inactive = 'inactive';

/**
 * Makes a Components-owned tool take part in its toolbar's single Tab stop. React renders the
 * tab index, so nothing rewrites DOM attributes that React also owns. A tool with an explicit
 * tab index keeps it and stays outside the roving set.
 * @param explicitTabIndex The tab index the consumer set on the tool, if any.
 * @param onFocus The consumer's focus handler, called before the tool becomes active.
 * @returns The ref, tab index, and focus handler to spread onto the tool's element.
 */
export const useRovingTool = <TElement extends HTMLElement>(
    explicitTabIndex: number | undefined,
    onFocus: ((event: FocusEvent<TElement>) => void) | undefined,
): RovingToolProps<TElement> => {
    const roving = useContext(ToolbarRovingContext);
    const key = useId();
    // Only a tool without an explicit tab index is managed by the toolbar.
    const store = explicitTabIndex === undefined ? roving : null;
    const state = useSyncExternalStore(
        store ? store.subscribe : subscribeToNothing,
        () => {
            if (!store) return unmanaged;
            const activeKey = store.getActiveKey();
            if (activeKey === null) return undecided;
            if (!store.isInScope(key)) return unmanaged;
            return activeKey === key ? active : inactive;
        },
        // Server-rendered markup keeps native Tab stops until the toolbar chooses its active tool.
        () => (store ? undecided : unmanaged),
    );
    const ref = useCallback((element: TElement | null) => {
        store?.register(key, element);
    }, [store, key]);
    const handleFocus = useCallback((event: FocusEvent<TElement>) => {
        onFocus?.(event);
        store?.activate(key);
    }, [onFocus, store, key]);
    if (!store) return { tabIndex: explicitTabIndex, onFocus };
    // A tool outside the toolbar's scope still registers, so the toolbar can notice when it enters.
    return {
        ref,
        tabIndex: state === active ? 0 : state === inactive ? -1 : undefined,
        onFocus: handleFocus,
    };
};
