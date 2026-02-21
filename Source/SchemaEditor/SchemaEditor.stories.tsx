// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SchemaEditor } from './SchemaEditor';
import { JsonSchema } from '../types/JsonSchema';

const meta: Meta<typeof SchemaEditor> = {
    title: 'Components/SchemaEditor',
    component: SchemaEditor,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof SchemaEditor>;

const sampleSchema: JsonSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            format: 'guid',
            description: 'Unique identifier'
        },
        name: {
            type: 'string',
            description: 'Name of the entity'
        },
        email: {
            type: 'string',
            description: 'Email address'
        },
        age: {
            type: 'integer',
            format: 'int32',
            description: 'Age in years'
        },
        isActive: {
            type: 'boolean',
            description: 'Whether the entity is active'
        },
        address: {
            type: 'object',
            description: 'Address information',
            properties: {
                street: {
                    type: 'string',
                    description: 'Street address'
                },
                city: {
                    type: 'string',
                    description: 'City name'
                },
                zipCode: {
                    type: 'string',
                    description: 'ZIP/Postal code'
                },
                country: {
                    type: 'string',
                    description: 'Country name'
                }
            }
        },
        tags: {
            type: 'array',
            description: 'Tags associated with the entity',
            items: { type: 'string' }
        },
        metadata: {
            type: 'array',
            description: 'Metadata entries',
            items: {
                type: 'object',
                properties: {
                    key: { type: 'string' },
                    value: { type: 'string' }
                }
            }
        }
    }
};

const InteractiveWrapper = () => {
    const [schema, setSchema] = useState<JsonSchema>(JSON.parse(JSON.stringify(sampleSchema)));

    return (
        <div style={{ height: '600px', background: 'var(--surface-ground)' }}>
            <SchemaEditor
                schema={schema}
                eventTypeName="User"
                canEdit={true}
                onChange={(newSchema) => {
                    setSchema(newSchema);
                    console.log('Schema changed:', newSchema);
                }}
                onSave={() => console.log('Save clicked', schema)}
                onCancel={() => console.log('Cancel clicked')}
            />
        </div>
    );
};

export const Interactive: Story = {
    render: () => <InteractiveWrapper />,
};

export const ViewMode: Story = {
    args: {
        schema: sampleSchema,
        eventTypeName: 'User',
        canEdit: true,
        onChange: () => console.log('Schema changed'),
        onSave: () => console.log('Save clicked'),
        onCancel: () => console.log('Cancel clicked'),
    },
};

export const EditMode: Story = {
    args: {
        schema: sampleSchema,
        eventTypeName: 'User',
        canEdit: true,
        editMode: true,
        onChange: () => console.log('Schema changed'),
        onSave: () => console.log('Save clicked'),
        onCancel: () => console.log('Cancel clicked'),
    },
};

export const ReadOnly: Story = {
    args: {
        schema: sampleSchema,
        eventTypeName: 'User',
        canEdit: false,
        canNotEditReason: 'Schema is locked for editing',
        onChange: () => console.log('Schema changed'),
    },
};

const emptySchema: JsonSchema = {
    type: 'object',
    properties: {}
};

export const EmptySchema: Story = {
    args: {
        schema: emptySchema,
        eventTypeName: 'NewType',
        canEdit: true,
        editMode: true,
        onChange: () => console.log('Schema changed'),
        onSave: () => console.log('Save clicked'),
        onCancel: () => console.log('Cancel clicked'),
    },
};

const simpleSchema: JsonSchema = {
    type: 'object',
    properties: {
        title: {
            type: 'string',
            description: 'The title'
        },
        count: {
            type: 'integer',
            description: 'A count value'
        },
        enabled: {
            type: 'boolean',
            description: 'Whether enabled'
        }
    }
};

export const SimpleSchema: Story = {
    args: {
        schema: simpleSchema,
        eventTypeName: 'SimpleType',
        canEdit: true,
        onChange: () => console.log('Schema changed'),
    },
};
