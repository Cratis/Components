// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef } from 'react';

const isDisabledAndFocused = (control: HTMLElement | null): control is HTMLButtonElement =>
    control !== null &&
    document.activeElement === control &&
    (control as HTMLButtonElement).disabled === true;

// Paging to either end disables the control that was just activated, which would drop keyboard
// focus to the page body. Keep it inside the paginator, on the nearest enabled control.
const keepFocusInsidePaginator = (
    control: HTMLElement | null,
    root: HTMLDivElement | null,
    isLast: boolean,
) => {
    if (!isDisabledAndFocused(control)) return;
    const buttons = [...(root?.querySelectorAll('button') ?? [])];
    const index = buttons.indexOf(control);
    const candidates = isLast ? buttons.slice(0, index).reverse() : buttons.slice(index + 1);
    candidates.find((button) => !button.disabled)?.focus();
};

/** Tracks the focused control of the paginator root and keeps focus inside it at either end. */
export const usePaginatorFocus = (isFirst: boolean, isLast: boolean) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const focusedControl = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        keepFocusInsidePaginator(focusedControl.current, rootRef.current, isLast);
    }, [isFirst, isLast]);

    return { rootRef, focusedControl };
};
