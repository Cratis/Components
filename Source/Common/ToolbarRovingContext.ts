// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useCallback, useContext, useId, type FocusEvent, type Ref } from 'react';

/** The single-Tab-stop state a toolbar shares with the tools it owns. */
export interface ToolbarRoving {
    /**
     * The tab index a registered tool renders: 0 for the active tool, -1 for the others, or
     * undefined (native) until the toolbar has chosen an active tool.
     */
    tabIndexFor(key: string): number | undefined;
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
    const managed = roving !== null && explicitTabIndex === undefined;
    const ref = useCallback((element: TElement | null) => {
        if (managed) roving?.register(key, element);
    }, [managed, roving, key]);
    const handleFocus = useCallback((event: FocusEvent<TElement>) => {
        onFocus?.(event);
        if (managed) roving?.activate(key);
    }, [managed, onFocus, roving, key]);
    if (!managed) return { tabIndex: explicitTabIndex, onFocus };
    return { ref, tabIndex: roving?.tabIndexFor(key), onFocus: handleFocus };
};
