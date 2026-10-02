// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { ConfigurationEditor } from './ConfigurationEditor';
import { ConfigurationEditorProvider } from './ConfigurationEditorProvider';
import { PropertyControls } from './PropertyControls';
import type { PropertyGroup } from './PropertyGroup';

const meta: Meta<typeof PropertyControls> = {
    title: 'ConfigurationEditor/PropertyControls',
    component: PropertyControls,
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Descriptors are the host's. These synthetic ones describe an ordered flow, a grid placement and a
 * freeform placement; a layout type the host adds later (here "masonry") only needs its own descriptors.
 */
const flow: PropertyGroup = {
    id: 'flow',
    title: 'Flow',
    properties: [
        { kind: 'number', name: 'gap', label: 'Gap', min: 0, max: 64, step: 4, unit: 'px' },
        { kind: 'number', name: 'padding', label: 'Padding', min: 0, max: 64, step: 4, unit: 'px' },
        { kind: 'choice', name: 'align', label: 'Alignment', options: [{ value: 'start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'End' }] },
        { kind: 'boolean', name: 'grow', label: 'Grow to fill the space' },
    ],
};

const grid: PropertyGroup = {
    id: 'grid',
    title: 'Grid placement',
    description: 'How this component sits inside a grid.',
    properties: [
        { kind: 'number', name: 'columns', label: 'Columns', min: 1, max: 12, required: true },
        { kind: 'number', name: 'span', label: 'Column span', min: 1, max: 12, editable: false, unavailableReason: 'The template fixes the span.' },
    ],
};

const freeform: PropertyGroup = {
    id: 'freeform',
    title: 'Freeform placement',
    properties: [
        { kind: 'number', name: 'x', label: 'Left', unit: 'px' },
        { kind: 'number', name: 'y', label: 'Top', unit: 'px' },
    ],
};

const masonry: PropertyGroup = {
    id: 'masonry',
    title: 'Masonry',
    description: 'A synthetic layout type the host added without any change to these controls.',
    properties: [
        { kind: 'number', name: 'masonryColumns', label: 'Column count', min: 1, max: 6 },
        { kind: 'choice', name: 'masonryOrder', label: 'Fill order', options: [{ value: 'row', label: 'Row by row' }, { value: 'column', label: 'Column by column' }] },
    ],
};

const compact: PropertyGroup = {
    id: 'compact',
    title: 'Compact screens',
    description: 'Overrides that apply on narrow screens.',
    properties: [{ kind: 'number', name: 'gap@compact', label: 'Gap', min: 0, max: 32, unit: 'px' }],
};

const Controls = ({ groups, initial }: { groups: PropertyGroup[]; initial: Record<string, unknown> }) => {
    const [values, setValues] = useState(initial);
    return (
        <div style={{ maxWidth: 480, display: 'grid', gap: '1rem' }}>
            <PropertyControls aria-label='Layout settings' groups={groups} values={values} onChange={(proposal) => setValues({ ...proposal.values })} />
            <output data-testid='values' style={{ fontSize: '0.8125rem' }}>{JSON.stringify(values)}</output>
        </div>
    );
};

/** Flow, grid placement and freeform placement, all driven by descriptors. */
export const LayoutSettings: Story = {
    render: () => <Controls groups={[flow, grid, freeform]} initial={{ gap: 8, align: 'start', columns: 2, span: 2 }} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.selectOptions(canvas.getByLabelText('Alignment'), 'center');
        await expect(canvas.getByTestId('values')).toHaveTextContent('"align":"center"');
        await userEvent.clear(canvas.getByLabelText('Columns'));
        await expect(await canvas.findByText('Enter a value.')).toBeVisible();
        await expect(canvas.getByText('The template fixes the span.')).toBeVisible();
    },
};

/** An additional host-defined layout type with its own descriptors and a responsive override group. */
export const AdditionalLayoutTypeAndResponsiveSettings: Story = {
    render: () => <Controls groups={[masonry, compact]} initial={{ masonryColumns: 3 }} />,
};

/** Narrow panels stack each label above its control. */
export const NarrowPanel: Story = {
    render: () => (
        <div style={{ width: 260 }}>
            <Controls groups={[flow, grid]} initial={{ gap: 8 }} />
        </div>
    ),
};

/** Every value shown as text, for a component whose configuration the person may not change. */
export const ReadOnly: Story = {
    render: () => (
        <PropertyControls
            aria-label='Layout settings'
            groups={[flow]}
            values={{ gap: 8, align: 'center', grow: true }}
            readOnly
            onChange={() => undefined}
        />
    ),
};

/**
 * Component-provided editors versus the generic fallback: the host registers a specialised editor
 * under its own component type name; any other type gets generic property controls.
 */
export const ComponentSpecificEditorWithFallback: Story = {
    render: () => {
        const Demo = () => {
            const [value, setValue] = useState<Record<string, unknown>>({ gap: 8 });
            return (
                <ConfigurationEditorProvider
                    editors={{
                        navigation: () => <p data-testid='specialised'>A navigation component brings its own editor.</p>,
                    }}
                >
                    <div style={{ maxWidth: 480, display: 'grid', gap: '1rem' }}>
                        <ConfigurationEditor componentType='navigation' value={value} onChange={setValue} />
                        <ConfigurationEditor
                            componentType='banner'
                            value={value}
                            onChange={setValue}
                            fallback={<PropertyControls aria-label='Banner settings' groups={[flow]} values={value} onChange={(proposal) => setValue({ ...proposal.values })} />}
                        />
                    </div>
                </ConfigurationEditorProvider>
            );
        };
        return <Demo />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByTestId('specialised')).toBeVisible();
        await expect(canvas.getByLabelText('Gap')).toBeVisible();
    },
};
