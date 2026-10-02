// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { useState, type ReactNode } from 'react';
import { OrderedItemEditor } from './OrderedItemEditor';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { IconPickerAllowed } from '../IconPicker/IconPickerAllowed';
import type { IconPickerCatalog } from '../IconPicker/IconPickerCatalog';
import type { IconPickerEntry } from '../IconPicker/IconPickerEntry';
import type { ConfigurationDestination } from './ConfigurationDestination';

const meta: Meta<typeof OrderedItemEditor> = {
    title: 'ConfigurationEditor/OrderedItemEditor',
    component: OrderedItemEditor,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Synthetic "Example Project" fixture: one fixed Home item, two configurable pages. */
const fixedItems: OrderedItem[] = [
    { id: 'home', label: 'Home', icon: { library: 'example-glyphs', key: 'home' }, destination: 'overview' },
];

const initialPages: OrderedItem[] = [
    { id: 'page-a', label: 'Page A', icon: { library: 'example-glyphs', key: 'square' }, destination: 'overview' },
    { id: 'page-b', label: 'Page B', destination: 'details' },
];

const destinations: ConfigurationDestination[] = [
    { id: 'overview', label: 'Overview', group: 'Reports' },
    { id: 'details', label: 'Details', group: 'Reports' },
    { id: 'settings', label: 'Settings' },
];

/** Draws a synthetic glyph from simple geometry. None of these shapes comes from a real icon set. */
const glyph = (shapes: ReactNode) => () => (
    <svg width='1em' height='1em' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
        {shapes}
    </svg>
);

const house = <path d='M4 11 L12 4 L20 11 V20 H4 Z' />;
const square = <rect x='4' y='4' width='16' height='16' />;
const circle = <circle cx='12' cy='12' r='8' />;
const bars = <path d='M6 20 V10 M12 20 V4 M18 20 V14' />;
const wave = <path d='M3 12 Q7.5 3 12 12 T21 12' />;

const entry = (
    library: string,
    key: string,
    name: string,
    categories: string[],
    shapes: ReactNode,
    extra: Partial<IconPickerEntry> = {},
): IconPickerEntry => ({ library, key, name, categories, renderPreview: glyph(shapes), ...extra });

/** Two synthetic libraries that both define `home`: identity is the library plus the key, never the name. */
const iconCatalog: IconPickerCatalog = {
    libraries: [
        { id: 'example-glyphs', name: 'Example Glyphs', attribution: 'Synthetic glyphs drawn for these stories' },
        { id: 'sample-symbols', name: 'Sample Symbols', attribution: 'Synthetic symbols for these stories' },
    ],
    icons: [
        entry('example-glyphs', 'home', 'Home', ['Places'], house),
        entry('example-glyphs', 'square', 'Square', ['Shapes'], square),
        entry('example-glyphs', 'circle', 'Circle', ['Shapes'], circle),
        entry('sample-symbols', 'home', 'Home', ['Places'], house),
        entry('sample-symbols', 'bars', 'Bar chart', ['Charts'], bars),
        entry('sample-symbols', 'wave', 'Wave', ['Charts'], wave),
    ],
};

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

let counter = 0;

const Host = ({
    capabilities,
    allowedIcons,
    applied,
}: {
    capabilities: OrderedItemCapabilities;
    allowedIcons?: IconPickerAllowed;
    applied?: (summary: string) => void;
}) => {
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
                iconCatalog={iconCatalog}
                allowedIcons={allowedIcons}
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

        // The icon field is the Components icon picker, fed by the host's synthetic catalog.
        await userEvent.click(canvas.getByRole('button', { name: /Icon: Page A/ }));
        const popout = within(await within(document.body).findByRole('dialog'));
        await userEvent.click(await popout.findByRole('option', { name: /Circle/ }));
        await waitFor(() => expect(canvas.getByTestId('last-proposal')).toHaveTextContent('update: Page A, Page B'));
        await waitFor(() => expect(canvas.getByRole('button', { name: /Icon: Page A/ })).toHaveTextContent('Circle'));

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

        // A read-only icon stays focusable and readable, but the picker does not open.
        const icon = canvas.getByRole('button', { name: /Icon: Page A/ });
        await expect(icon).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(icon);
        await expect(within(document.body).queryByRole('dialog')).toBeNull();
        await expect(canvas.getByTestId('last-proposal')).toHaveTextContent('No proposal yet');
    },
};

/** Host C lets the person change icons, but only to ones from the allowed set; the rest are listed and unavailable. */
export const HostRestrictsIconsToAnAllowedSet: Story = {
    render: () => (
        <Host
            capabilities={hostA}
            allowedIcons={[
                { library: 'example-glyphs', key: 'home' },
                { library: 'example-glyphs', key: 'square' },
            ]}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /Icon: Page A/ }));
        const popout = within(await within(document.body).findByRole('dialog'));
        const blocked = await popout.findByRole('option', { name: /Circle/ });
        await expect(blocked).toHaveAttribute('aria-disabled', 'true');
        await userEvent.click(blocked);
        await expect(canvas.getByTestId('last-proposal')).toHaveTextContent('No proposal yet');
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

/** The item's icon is no longer in the host's catalog, so the picker shows its identity with a warning. */
export const UnavailableIcon: Story = {
    render: () => (
        <div style={{ maxWidth: 520 }}>
            <OrderedItemEditor
                aria-label='Navigation'
                items={[{ id: 'page-a', label: 'Page A', icon: { library: 'retired-icons', key: 'gone' } }]}
                capabilities={hostA}
                destinations={destinations}
                iconCatalog={iconCatalog}
                onChange={() => undefined}
            />
        </div>
    ),
};
