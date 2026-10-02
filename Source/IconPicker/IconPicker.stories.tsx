// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { IconPicker, type IconPickerProps } from './IconPicker';
import type { IconPickerCatalog } from './IconPickerCatalog';
import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerLibrary } from './IconPickerLibrary';
import type { IconPickerValue } from './IconPickerValue';
import { narrowViewportQuery } from './useNarrowViewport';

/** Draws a synthetic glyph from simple geometry. None of these shapes comes from a real icon set. */
const glyph = (shapes: ReactNode) => () => (
    <svg width='1em' height='1em' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden='true'>
        {shapes}
    </svg>
);

const shapes: Record<string, ReactNode> = {
    circle: <circle cx='12' cy='12' r='8' />,
    square: <rect x='4' y='4' width='16' height='16' />,
    triangle: <path d='M12 4 L21 20 H3 Z' />,
    diamond: <path d='M12 3 L21 12 L12 21 L3 12 Z' />,
    cross: <path d='M12 4 V20 M4 12 H20' />,
    house: <path d='M4 11 L12 4 L20 11 V20 H4 Z' />,
    arrowRight: <path d='M4 12 H20 M14 6 L20 12 L14 18' />,
    arrowLeft: <path d='M20 12 H4 M10 6 L4 12 L10 18' />,
    wave: <path d='M3 12 Q7.5 3 12 12 T21 12' />,
    bars: <path d='M6 20 V10 M12 20 V4 M18 20 V14' />,
};

const entry = (
    library: string,
    key: string,
    name: string,
    categories: string[],
    shape: keyof typeof shapes,
    extra: Partial<IconPickerEntry> = {},
): IconPickerEntry => ({ library, key, name, categories, renderPreview: glyph(shapes[shape]), ...extra });

const exampleGlyphs: IconPickerLibrary = {
    id: 'example-glyphs',
    name: 'Example Glyphs',
    version: '2.0.1',
    attribution: 'Synthetic glyphs drawn for these stories',
};
const sampleSymbols: IconPickerLibrary = { id: 'sample-symbols', name: 'Sample Symbols', attribution: 'Synthetic symbols for these stories' };

const exampleIcons = [
    entry('example-glyphs', 'home', 'Home', ['Places'], 'house', { tags: ['house', 'start'] }),
    entry('example-glyphs', 'circle', 'Circle', ['Shapes'], 'circle'),
    entry('example-glyphs', 'square', 'Square', ['Shapes'], 'square', { aliases: ['box'] }),
    entry('example-glyphs', 'triangle', 'Triangle', ['Shapes'], 'triangle'),
    entry('example-glyphs', 'diamond', 'Diamond', ['Shapes'], 'diamond'),
    entry('example-glyphs', 'arrow-left', 'Arrow left', ['Arrows'], 'arrowLeft', { aliases: ['back'] }),
    entry('example-glyphs', 'arrow-right', 'Arrow right', ['Arrows'], 'arrowRight', { aliases: ['next'] }),
    entry('example-glyphs', 'wave', 'Wave', ['Other'], 'wave'),
];

const sampleIcons = [
    entry('sample-symbols', 'home', 'Home', ['Places'], 'house'),
    entry('sample-symbols', 'bars', 'Bar chart', ['Charts'], 'bars', { tags: ['graph'] }),
    entry('sample-symbols', 'wave', 'Wave', ['Charts'], 'wave', { variant: 'thin' }),
    entry('sample-symbols', 'wave', 'Wave', ['Charts'], 'wave', { variant: 'bold' }),
    entry('sample-symbols', 'cross', 'Cross', ['Shapes'], 'cross', { deprecated: true }),
];

/** Two libraries that both define `home` - and `wave` - to show identity is never the name. */
const twoLibraries: IconPickerCatalog = { libraries: [exampleGlyphs, sampleSymbols], icons: [...exampleIcons, ...sampleIcons] };

const oneLibrary: IconPickerCatalog = { libraries: [exampleGlyphs], icons: exampleIcons };

/** A large catalog, to show previews drawing only as tiles scroll into view. */
const largeCatalog: IconPickerCatalog = {
    libraries: [exampleGlyphs],
    icons: Array.from({ length: 1500 }, (_, index) =>
        entry('example-glyphs', `generated-${index}`, `Generated glyph ${index + 1}`, [`Set ${Math.floor(index / 250) + 1}`], (['circle', 'square', 'triangle', 'diamond'] as const)[index % 4]),
    ),
};

const Picker = (props: Omit<IconPickerProps, 'value' | 'onChange'> & { initialValue?: IconPickerValue | null }) => {
    const { initialValue = null, ...rest } = props;
    const [value, setValue] = useState(initialValue);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: 'min(24rem, 90vw)' }}>
            <IconPicker {...rest} value={value} onChange={setValue} />
            <code data-testid='emitted'>{value ? JSON.stringify(value) : 'nothing selected'}</code>
        </div>
    );
};

/** Pretends the viewport is narrow, so the popout shows as a sheet, for as long as the story is mounted. */
const ForceNarrowViewport = ({ children }: { children: ReactNode }) => {
    const [original] = useState(() => {
        const previous = window.matchMedia;
        window.matchMedia = (query: string) =>
            query === narrowViewportQuery
                ? ({ matches: true, media: query, addEventListener: () => undefined, removeEventListener: () => undefined } as unknown as MediaQueryList)
                : previous.call(window, query);
        return previous;
    });
    useEffect(
        () => () => {
            window.matchMedia = original;
        },
        [original],
    );
    return <>{children}</>;
};

const meta = {
    title: 'IconPicker/IconPicker',
    component: Picker,
    args: { catalog: twoLibraries, 'aria-label': 'Toolbar icon' },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof Picker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two libraries that both define a `Home` icon: tiles name their provider, and picking one emits its qualified identity. */
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        await userEvent.click(canvas.getByRole('button', { name: /Toolbar icon/ }));
        const dialog = await body.findByRole('dialog');
        await userEvent.type(within(dialog).getByRole('searchbox'), 'home');
        const homes = within(dialog).getAllByRole('option', { name: /Home/ });
        await expect(homes).toHaveLength(2);
        await userEvent.click(within(dialog).getByRole('option', { name: /Home.*Sample Symbols/ }));
        await waitFor(() => expect(canvas.getByTestId('emitted').textContent).toBe('{"library":"sample-symbols","key":"home"}'));
        await waitFor(() => expect(canvasElement.ownerDocument.activeElement).toBe(canvas.getByRole('button', { name: /Toolbar icon/ })));
    },
};

export const WithSelection: Story = {
    args: { initialValue: { library: 'sample-symbols', key: 'wave', variant: 'bold' } },
};

export const SingleLibrary: Story = {
    args: { catalog: oneLibrary, initialValue: { library: 'example-glyphs', key: 'square' } },
};

export const LargeCatalog: Story = {
    args: { catalog: largeCatalog },
};

export const Loading: Story = {
    args: { catalog: { libraries: [exampleGlyphs], icons: exampleIcons.slice(0, 3), status: 'loading' }, initialValue: { library: 'example-glyphs', key: 'home' } },
};

export const Empty: Story = {
    args: { catalog: { libraries: [], icons: [] } },
};

export const ProviderFailure: Story = {
    args: { catalog: { libraries: [exampleGlyphs], icons: [], status: 'error', error: 'Example Glyphs could not be reached.' } },
};

export const MissingSelection: Story = {
    args: { initialValue: { library: 'retired-library', key: 'home' } },
};

export const ReadOnly: Story = {
    args: { readOnly: true, initialValue: { library: 'example-glyphs', key: 'circle' } },
};

export const Disabled: Story = {
    args: { disabled: true, initialValue: { library: 'example-glyphs', key: 'circle' } },
};

/** The field accepts only arrows; every other icon is listed but cannot be selected. */
export const Restricted: Story = {
    args: { allowed: (candidate: IconPickerEntry) => candidate.categories.includes('Arrows') },
};

export const Invalid: Story = {
    args: { validationMessage: 'Choose an icon to continue.' },
};

export const NarrowViewport: Story = {
    decorators: [Story => <ForceNarrowViewport>{Story()}</ForceNarrowViewport>],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /Toolbar icon/ }));
        await waitFor(() => expect(canvasElement.ownerDocument.querySelector('.cratis-icon-picker__sheet')).toBeTruthy());
    },
};
