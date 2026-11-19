// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';

// Open dialogs in the order they opened; only the last one answers Escape.
const openDialogs: symbol[] = [];

/**
 * Lets Escape dismiss an open dialog, in the bubbling phase, even when focus has left it. PrimeReact's
 * own Escape listener runs in the capture phase and would dismiss the dialog before a nested overlay
 * (a popover or select inside it) could consume the press, so the dialog turns it off and uses this.
 * A press an overlay already handled (`defaultPrevented`) is ignored, and a stack keeps a parent dialog
 * from answering while a dialog opened above it is open.
 *
 * @param open Whether the dialog is currently open.
 * @param onEscape Called when Escape is pressed anywhere in the document and this is the topmost dialog.
 */
export const useEscapeFromAnywhere = (open: boolean, onEscape: () => void) => {
    const latest = useRef(onEscape);
    latest.current = onEscape;
    useEffect(() => {
        if (!open) return;
        const id = Symbol('dialog');
        openDialogs.push(id);
        const listener = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !event.defaultPrevented && openDialogs[openDialogs.length - 1] === id) latest.current();
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
            openDialogs.splice(openDialogs.indexOf(id), 1);
        };
    }, [open]);
};
