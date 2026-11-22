// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemLabels } from './OrderedItemLabels';

export interface PendingOrderedItemFocus {
    itemId: string | undefined;
    control: string;
    announce: boolean;
}

type FocusContext = {
    rootRef: RefObject<HTMLDivElement | null>;
    pending: RefObject<PendingOrderedItemFocus | null>;
    restoring: RefObject<boolean>;
    items: ReadonlyArray<OrderedItem>;
    labels: Required<OrderedItemLabels>;
    setAnnouncement: (message: string) => void;
};

const findRow = (root: HTMLElement, itemId: string | undefined) => itemId === undefined
    ? root
    : Array.from(root.querySelectorAll<HTMLElement>('[data-item-id]')).find((element) => element.dataset.itemId === itemId);

const findControl = (row: HTMLElement, target: PendingOrderedItemFocus) => {
    const control = Array.from(row.querySelectorAll<HTMLElement>('[data-control]')).find(
        (element) => element.dataset.control === target.control,
    );
    return control ?? (target.itemId === undefined ? undefined : row);
};

const announceMove = ({ items, labels, setAnnouncement }: FocusContext, target: PendingOrderedItemFocus) => {
    if (!target.announce || target.itemId === undefined) return;
    const index = items.findIndex((item) => item.id === target.itemId);
    if (index >= 0) setAnnouncement(labels.moved(items[index].label || labels.untitled, index + 1, items.length));
};

/** Restores only a pending, host-applied operation; cancelled proposals are cleared by user input. */
export const restoreOrderedItemFocus = (context: FocusContext) => {
    const { rootRef, pending, restoring } = context;
    const target = pending.current;
    const root = rootRef.current;
    if (!target || !root) return;
    const row = findRow(root, target.itemId);
    if (!row) return;
    const focusable = findControl(row, target);
    if (!focusable) return;
    restoring.current = true;
    focusable.focus();
    restoring.current = false;
    pending.current = null;
    announceMove(context, target);
};
