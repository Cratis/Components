// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { OrderedItem } from '../OrderedItem';
import type { OrderedItemCapabilities } from '../OrderedItemCapabilities';
import type { ConfigurationDestination } from '../ConfigurationDestination';
import type { OrderedItemIconFieldProps } from '../OrderedItemIconFieldProps';
import { OrderedItemEditor } from '../OrderedItemEditor';
import { twoLibraryCatalog } from '../../IconPicker/for_IconPicker/given/a_synthetic_catalog';
import type { OrderedItemEditorProps } from '../OrderedItemEditor';
import type { OrderedItemProposal } from '../OrderedItemProposal';

/** Synthetic "Example Project" fixture: one fixed item and two configurable pages. */
export const fixedItems: OrderedItem[] = [
    { id: 'home', label: 'Home', icon: { library: 'example-glyphs', key: 'home' }, destination: 'overview' },
];

export const pageItems = (): OrderedItem[] => [
    { id: 'page-a', label: 'Page A', icon: { library: 'example-glyphs', key: 'map' }, destination: 'overview' },
    { id: 'page-b', label: 'Page B', destination: 'details' },
];

export const destinations: ConfigurationDestination[] = [
    { id: 'overview', label: 'Overview', group: 'Reports' },
    { id: 'details', label: 'Details', group: 'Reports' },
    { id: 'settings', label: 'Settings' },
];

/** Host A allows everything. */
export const allowEverything: OrderedItemCapabilities = {
    add: true,
    remove: true,
    reorder: true,
    fields: { label: 'editable', icon: 'editable', destination: 'editable' },
};

/** Host B keeps the icon read-only, and forbids adding and removing. */
export const restricted: OrderedItemCapabilities = {
    add: false,
    remove: false,
    reorder: true,
    fields: { label: 'editable', icon: 'readonly', destination: 'editable' },
    reasons: { add: 'This template does not allow new pages.', icon: 'Icons are set by the template.' },
};

/** The host's own icon chooser, used to exercise the `renderIconField` override seam. */
export const renderIconField = ({ value, onChange, readOnly, 'aria-label': ariaLabel }: OrderedItemIconFieldProps) => (
    <span>
        <span data-testid='icon-value'>{value ? `${value.library}/${value.key}` : 'none'}</span>
        {!readOnly && (
            <button type='button' aria-label={ariaLabel} onClick={() => onChange({ library: 'example-icons', key: 'star' })}>
                Pick
            </button>
        )}
    </span>
);

export type HarnessProps = Partial<OrderedItemEditorProps> & {
    proposals: OrderedItemProposal[];
    initial?: OrderedItem[];
    capabilities?: OrderedItemCapabilities;
    /** When false the host ignores every proposal, which cancels it. */
    apply?: boolean;
};

let created = 0;

/** A controlled host: applies every proposal it receives unless told to cancel. */
export const Harness = ({ proposals, initial = pageItems(), capabilities = allowEverything, apply = true, ...rest }: HarnessProps) => {
    const [items, setItems] = useState(initial);
    return (
        <OrderedItemEditor
            items={items}
            fixedItems={fixedItems}
            capabilities={capabilities}
            destinations={destinations}
            createItem={() => ({ id: `new-${++created}`, label: 'New page' })}
            iconCatalog={twoLibraryCatalog()}
            onChange={(proposal) => {
                proposals.push(proposal);
                if (apply) setItems([...proposal.items]);
            }}
            aria-label='Navigation items'
            {...rest}
        />
    );
};
