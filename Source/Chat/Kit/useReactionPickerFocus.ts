// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type KeyboardEvent, type RefObject, useEffect, useRef } from 'react';

const dismissOnOutsidePointer = (root: HTMLElement, anchorRef: RefObject<HTMLElement | null> | undefined, onDismiss: () => void) => {
    const ownerDocument = root.ownerDocument;
    const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (root.contains(target) || anchorRef?.current?.contains(target)) return;
        onDismiss();
    };
    // Capture phase, so items that stop pointerdown propagation still dismiss the picker.
    ownerDocument.addEventListener('pointerdown', handlePointerDown, true);
    return () => ownerDocument.removeEventListener('pointerdown', handlePointerDown, true);
};

/** Keeps picker dismissal local to its focus scope while respecting the opening button. */
export const useReactionPickerFocus = (anchorRef: RefObject<HTMLElement | null> | undefined, onDismiss: () => void) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        return dismissOnOutsidePointer(root, anchorRef, onDismiss);
    }, [onDismiss, anchorRef]);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        onDismiss();
    };

    return { rootRef, onKeyDown };
};
