// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { OrderedItemEditor } from './OrderedItemEditor';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { OrderedItemIconFieldProps } from './OrderedItemIconFieldProps';
import type { ConfigurationDestination } from './ConfigurationDestination';
import type { ConfigurationIconReference } from './ConfigurationIconReference';

const meta: Meta<typeof OrderedItemEditor> = {
    title: 'ConfigurationEditor/OrderedItemEditor',
    component: OrderedItemEditor,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Synthetic "Example Project" fixture: one fixed Home item, two configurable pages. */
const fixedItems: OrderedItem[] = [
    { id: 'home', label: 'Home', icon: { library: 'example-icons', key: 'house' }, destination: 'overview' },
];

const initialPages: OrderedItem[] = [
    { id: 'page-a', label: 'Page A', icon: { library: 'example-icons', key: 'file' }, destination: 'overview' },
    { id: 'page-b', label: 'Page B', destination: 'details' },
];

const destinations: ConfigurationDestination[] = [
    { id: 'overview', label: 'Overview', group: 'Reports' },
    { id: 'details', label: 'Details', group: 'Reports' },
    { id: 'settings', label: 'Settings' },
];

const exampleIcons: ConfigurationIconReference[] = [
    { library: 'example-icons', key: 'house' },
    { library: 'example-icons', key: 'file' },
    { library: 'example-icons', key: 'star' },
    { library: 'example-icons', key: 'chart' },
];

const hostA: OrderedItemCapabilities = {
    add: true,
    remove: true,
    reorder: true,
    fields: { label: 'editable', icon: 'editable', destination: 'editable' },
};

const hostB: OrderedItemCapabilities = {
    add: false,
    remove: false,
    reorder: true,
    fields: { label: 'editable', icon: 'readonly', destination: 'editable' },
    reasons: {
        add: 'This template does not allow new pages.',
        icon: 'Icons are set by the template.',
    },
};

/**
 * A stand-in for the host's icon chooser. A real host renders the Components icon picker here
 * with its own catalog; the editor only hands over the current value and receives the pick.
 */
const ExampleIconField = ({ value, onChange, readOnly, 'aria-label': ariaLabel }: OrderedItemIconFieldProps) => (
    <select
        aria-label={ariaLabel}
        disabled={readOnly}
        value={value ? `${value.library}/${value.key}` : ''}
        onChange={(event) => {
            const picked = exampleIcons.find((icon) => `${icon.library}/${icon.key}` === event.target.value);
            if (picked) onChange(picked);
        }}
    >
        <option value=''>No icon</option>
        {exampleIcons.map((icon) => (
            <option key={icon.key} value={`${icon.library}/${icon.key}`}>{icon.key}</option>
        ))}
    </select>
);

let counter = 0;

const Host = ({ capabilities, applied }: { capabilities: OrderedItemCapabilities; applied?: (summary: string) => void }) => {
    const [items, setItems] = useState(initialPages);
    const [last, setLast] = useState('No proposal yet');
    return (
        <div style={{ maxWidth: 520, display: 'grid', gap: '1rem' }}>
            <OrderedItemEditor
                aria-label='Navigation'
                items={items}
                fixedItems={fixedItems}
                capabilities={capabilities}
                destinations={destinations}
                createItem={() => ({ id: `page-new-${++counter}`, label: 'New page' })}
                renderIconField={(props) => <ExampleIconField {...props} />}
                onChange={(proposal) => {
                    const summary = `${proposal.kind}: ${proposal.items.map((item) => item.label).join(', ')}`;
                    setLast(summary);
                    applied?.(summary);
                    setItems([...proposal.items]);
                }}
            />
            <output data-testid='last-proposal' style={{ fontSize: '0.8125rem' }}>{last}</output>
        </div>
    );
};

/** Host A allows every item operation and every field. */
export const HostAllowsEverything: Story = {
    render: () => <Host capabilities={hostA} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Fixed items')).toBeVisible();
        await expect(canvas.getByText('Locked')).toBeVisible();

        await userEvent.click(canvas.getByRole('button', { name: 'Move Page A down' }));
        await waitFor(() => expect(canvas.getByTestId('last-proposal')).toHaveTextContent('move: Page B, Page A'));
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Move Page A down' })).toHaveFocus());

        await userEvent.click(canvas.getByRole('button', { name: 'Add item' }));
        await waitFor(() => expect(canvas.getByTestId('last-proposal')).toHaveTextContent('add: Page B, Page A, New page'));
    },
};

/** Host B restricts icon editing and the add and remove operations, and says why. */
export const HostRestrictsIconsAndCollection: Story = {
    render: () => <Host capabilities={hostB} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.queryByRole('button', { name: 'Add item' })).toBeNull();
        await expect(canvas.queryByRole('button', { name: /^Remove/ })).toBeNull();
        await expect(canvas.getByText('This template does not allow new pages.')).toBeVisible();
        await expect(canvas.getByText('Icons are set by the template.')).toBeVisible();
        await expect(canvas.getAllByRole('button', { name: /^Move Page/ }).length).toBeGreaterThan(0);
    },
};

/** An empty collection, with only the fixed item. */
export const EmptyCollection: Story = {
    render: () => (
        <div style={{ maxWidth: 520 }}>
            <OrderedItemEditor
                aria-label='Navigation'
                items={[]}
                fixedItems={fixedItems}
                capabilities={hostA}
                destinations={destinations}
                createItem={() => ({ id: 'page-first', label: 'First page' })}
                onChange={() => undefined}
            />
        </div>
    ),
};

/** A blank label is never proposed; the message says why and the entry is restored on blur. */
export const ValidationErrors: Story = {
    render: () => <Host capabilities={hostA} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const [input] = canvas.getAllByRole('textbox');
        await userEvent.clear(input);
        await expect(await canvas.findByRole('alert')).toHaveTextContent('Enter a label.');
        await expect(canvas.getByTestId('last-proposal')).toHaveTextContent('No proposal yet');
    },
};

/** Long labels and a narrow panel: the item stacks its controls and wraps text. */
export const NarrowPanelWithLongLabels: Story = {
    render: () => (
        <div style={{ width: 280 }}>
            <OrderedItemEditor
                aria-label='Navigation'
                items={[
                    { id: 'long', label: 'A very long page label that has to wrap inside a narrow configuration panel', destination: 'details' },
                    { id: 'short', label: 'Short' },
                ]}
                fixedItems={[{ id: 'home', label: 'Home page with a long inherited label' }]}
                capabilities={hostA}
                destinations={destinations}
                createItem={() => ({ id: 'created', label: 'New page' })}
                onChange={() => undefined}
            />
        </div>
    ),
};

/** The host reports that an icon is no longer in its catalog. */
export const UnavailableIcon: Story = {
    render: () => (
        <div style={{ maxWidth: 520 }}>
            <OrderedItemEditor
                aria-label='Navigation'
                items={[{ id: 'page-a', label: 'Page A', icon: { library: 'retired-icons', key: 'gone' } }]}
                capabilities={hostA}
                destinations={destinations}
                isIconAvailable={(icon) => icon.library !== 'retired-icons'}
                renderIconField={(props) => <ExampleIconField {...props} />}
                onChange={() => undefined}
            />
        </div>
    ),
};
