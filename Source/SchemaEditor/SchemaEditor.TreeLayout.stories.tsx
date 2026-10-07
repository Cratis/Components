// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { SchemaEditor } from './SchemaEditor';
import type { Property } from './Tree/Property';
import type { PropertyConcept } from './Tree/PropertyConcept';
import { PropertyType } from './Tree/PropertyType';
import type { JsonSchema } from '../types/JsonSchema';

const meta: Meta<typeof SchemaEditor> = {
    title: 'SchemaEditor/Tree layout',
    component: SchemaEditor,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Synthetic "Example Order" fixture: every property is made up for these stories. */
const exampleSchema: JsonSchema = {
    type: 'object',
    properties: {
        orderNumber: { type: 'string' },
        placedOn: { type: 'string', format: 'date' },
        total: { type: 'number' },
        shipped: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'string' } },
        shippingAddress: {
            type: 'object',
            properties: {
                street: { type: 'string' },
                city: { type: 'string' },
            },
        },
        lines: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    sku: { type: 'string' },
                    quantity: { type: 'number' },
                },
            },
        },
    } as JsonSchema['properties'],
};

const conceptSchema: JsonSchema = {
    type: 'object',
    properties: { customerId: { type: 'string', 'x-concept': 'CustomerId' } as never },
};

const exampleConcepts: PropertyConcept[] = [
    { name: 'OrderNumber', type: PropertyType.String },
    { name: 'CustomerId', type: PropertyType.String },
    { name: 'Quantity', type: PropertyType.Number },
];

/** Shows the schema the editor last reported, which is what a host would store. */
const Output = ({ schema }: { schema: JsonSchema }) => (
    <pre role='region' tabIndex={0} aria-label='Resulting schema' style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
        {JSON.stringify(schema, undefined, 2)}
    </pre>
);

const Beside = ({ initial, children }: { initial: JsonSchema; children: (report: (schema: JsonSchema) => void) => React.ReactNode }) => {
    const [schema, setSchema] = useState(initial);
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
            {children(setSchema)}
            <Output schema={schema} />
        </div>
    );
};

/** A schema edited as a tree. The editor keeps the tree and reports the whole schema after each edit. */
export const Basic: Story = {
    render: () => (
        <Beside initial={exampleSchema}>
            {report => <SchemaEditor layout='tree' schema={exampleSchema} onChange={report} />}
        </Beside>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Delete shipped' }));
        await expect(canvas.queryByText('shipped')).toBeNull();
    },
};

/** Concepts are offered after the primitives and written as `x-concept` on the primitive they wrap. */
export const WithConcepts: Story = {
    render: () => (
        <Beside initial={conceptSchema}>
            {report => <SchemaEditor layout='tree' schema={conceptSchema} concepts={exampleConcepts} onChange={report} />}
        </Beside>
    ),
};

/** The key (`x-key`) and whether a property is required (`required`) are opt-in. */
export const RequiredAndKey: Story = {
    render: () => (
        <Beside initial={exampleSchema}>
            {report => (
                <SchemaEditor
                    layout='tree'
                    schema={{ ...exampleSchema, required: ['orderNumber'] }}
                    allowRequired
                    allowKeyProperty
                    onChange={report} />
            )}
        </Beside>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const keyButton = canvas.getByRole('button', { name: 'Use orderNumber as the key property' });
        await userEvent.click(keyButton);
        await expect(keyButton).toHaveAttribute('aria-pressed', 'true');
    },
};

/**
 * Product features attach through slots. Here an accessory button and a details area stand in for a rules
 * editor: the editor knows nothing about rules, and the host keeps them keyed by property name.
 */
export const WithAccessoryAndDetails: Story = {
    render: () => {
        const Example = () => {
            const [rules, setRules] = useState<Record<string, string[]>>({ orderNumber: ['Must not be empty'] });
            const addRule = (property: Property) =>
                setRules(current => ({ ...current, [property.name]: [...(current[property.name] ?? []), 'Must be unique'] }));
            return (
                <SchemaEditor
                    layout='tree'
                    schema={exampleSchema}
                    header={<strong>Example order</strong>}
                    renderPropertyAccessory={property => (
                        <button type='button' onClick={() => addRule(property)}>{`Add rule to ${property.name}`}</button>
                    )}
                    renderPropertyDetails={property => rules[property.name]?.length ? (
                        <ul aria-label={`Rules for ${property.name}`}>
                            {rules[property.name].map((rule, index) => <li key={`${rule}-${index}`}>{rule}</li>)}
                        </ul>
                    ) : undefined}
                    onPropertyRenamed={(property, previousName) => setRules(current => {
                        const { [previousName]: moved, ...rest } = current;
                        return moved ? { ...rest, [property.name]: moved } : current;
                    })} />
            );
        };
        return <Example />;
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Add rule to total' }));
        await expect(canvas.getByRole('list', { name: 'Rules for total' })).toBeInTheDocument();
    },
};

/** Controlled: the host owns the tree and applies each edit itself, here through the exported tree functions. */
export const Controlled: Story = {
    render: () => {
        const initial: Property[] = [
            { id: 'one', name: 'title', type: PropertyType.String },
            { id: 'two', name: 'done', type: PropertyType.Boolean },
        ];
        const Example = () => {
            const [properties, setProperties] = useState(initial);
            return (
                <SchemaEditor
                    layout='tree'
                    properties={properties}
                    onDeleteProperty={propertyId => setProperties(current => current.filter(property => property.id !== propertyId))} />
            );
        };
        return <Example />;
    },
};

/** A read-only editor shows the tree and nothing to edit. */
export const ReadOnly: Story = {
    render: () => <SchemaEditor layout='tree' schema={exampleSchema} readOnly />,
};

/** With concepts enabled but none defined, the menu says so instead of hiding the group. */
export const NoConceptsDefined: Story = {
    render: () => <SchemaEditor layout='tree' schema={exampleSchema} concepts={[]} />,
};

/** The editor marks each type badge with `data-property-type`; a host can also replace it. */
export const CustomTypeBadge: Story = {
    render: () => (
        <SchemaEditor
                    layout='tree'
            schema={exampleSchema}
            getPropertyRowState={property => property.name === 'total'
                ? { lockType: true, lockTypeReason: 'Mapped to an input, so the type cannot change' }
                : undefined}
            renderPropertyTypeBadge={(property, _context, defaultBadge) => (
                <span data-custom-badge={property.type}>{defaultBadge}</span>
            )} />
    ),
};
