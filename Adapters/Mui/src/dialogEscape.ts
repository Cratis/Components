// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';

// Open dialogs in the order they opened; only the last one answers Escape.
const openDialogs: symbol[] = [];

/**
 * Lets Escape dismiss an open dialog even when focus has left it. A Material UI modal only hears
 * Escape from inside itself, so a press while focus sits on the page body would otherwise be lost.
 * Presses that reach the modal are handled and stopped by Material UI before they get here, and a
 * stack keeps a parent dialog from answering while a dialog opened above it is open.
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
            if (event.key === 'Escape' && openDialogs[openDialogs.length - 1] === id) latest.current();
        };
        document.addEventListener('keydown', listener);
        return () => {
            document.removeEventListener('keydown', listener);
            openDialogs.splice(openDialogs.indexOf(id), 1);
        };
    }, [open]);
};
