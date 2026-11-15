// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useState, type Key } from 'react';

const occurrence = (id: string, label: string) => ({ id, label });

const reconcile = (value: string[], previous: ReturnType<typeof occurrence>[], prefix: string, nextId: number) => {
    const available = new Map<string, { items: typeof previous; index: number }>();
    for (const item of previous) {
        const queue = available.get(item.label) ?? { items: [], index: 0 };
        queue.items.push(item);
        available.set(item.label, queue);
    }
    const items = value.map((label) => {
        const queue = available.get(label);
        return queue?.items[queue.index++] ?? occurrence(`${prefix}-${nextId++}`, label);
    });
    return { value, items, nextId, pending: items };
};

const matches = (items: ReturnType<typeof occurrence>[], value: string[]) =>
    items.length === value.length && items.every((item, index) => item.label === value[index]);

export const useTagOccurrences = (value: string[], onChange: (value: string[]) => void) => {
    const prefix = useId();
    const [stored, setStored] = useState(() => reconcile(value, [], prefix, 0));
    let current = stored;
    if (stored.value !== value) {
        // Only an acknowledged local removal can disambiguate equal labels. Other replacements
        // match the nth new occurrence to the nth prior occurrence of the same label.
        const previous = matches(stored.pending, value) ? stored.pending : stored.items;
        current = reconcile(value, previous, prefix, stored.nextId);
        setStored(current);
    }

    const remove = (keys: Set<Key>) => {
        const pending = current.items.filter((item) => !keys.has(item.id));
        setStored({ ...current, pending });
        onChange(pending.map((item) => item.label));
    };

    return { items: current.items, remove };
};
