// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useLayoutEffect, useRef } from 'react';

const rowSelector = '[data-datatable-row-key]';
const selectionSelector = 'input[type="checkbox"], input[type="radio"]';
interface PresentationFocus { element: HTMLElement; key?: string; selection: boolean }

const rememberElement = (element: EventTarget | null, root: HTMLElement | null): PresentationFocus | undefined => {
    if (!(element instanceof HTMLElement) || !root?.contains(element)) return undefined;
    return {
        element,
        key: element.closest(rowSelector)?.getAttribute('data-datatable-row-key') ?? undefined,
        selection: element.matches(selectionSelector),
    };
};
const replacementTarget = (root: HTMLElement | null, outgoing: PresentationFocus) => {
    const row = Array.from(root?.querySelectorAll<HTMLElement>(rowSelector) ?? [])
        .find(candidate => candidate.getAttribute('data-datatable-row-key') === outgoing.key);
    const selection = outgoing.selection ? row?.querySelector<HTMLElement>(selectionSelector) : undefined;
    return selection ?? (row?.hasAttribute('tabindex') ? row : undefined) ?? root;
};
const restoreRemovedFocus = (root: HTMLElement | null, outgoing?: PresentationFocus) => {
    if (!outgoing || outgoing.element.isConnected) return;
    if (document.activeElement !== document.body) return;
    replacementTarget(root, outgoing)?.focus({ preventScroll: true });
};

/** Transfers only focus lost when the outgoing presentation is removed. Never moves external focus. */
export const useDataTablePresentationFocus = (cards: boolean) => {
    const root = useRef<HTMLDivElement>(null);
    const previous = useRef(cards);
    const focused = useRef<PresentationFocus | undefined>(undefined);
    useEffect(() => {
        const remember = (event: FocusEvent) => { focused.current = rememberElement(event.target, root.current); };
        document.addEventListener('focusin', remember);
        return () => document.removeEventListener('focusin', remember);
    }, []);
    useLayoutEffect(() => {
        if (previous.current !== cards) restoreRemovedFocus(root.current, focused.current);
        previous.current = cards;
    }, [cards]);
    return root;
};
