// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { ObjectContentEditor } from './ObjectContentEditor';
import { JsonSchema, Json } from '../types/JsonSchema';
import { useState } from 'react';

const meta: Meta<typeof ObjectContentEditor> = {
    title: 'Components/ObjectContentEditor',
    component: ObjectContentEditor,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ObjectContentEditor>;

const userSchema: JsonSchema = {
    type: 'object',
    properties: {
        id: {
            type: 'string',
            format: 'guid',
            description: 'Unique identifier for the user'
        },
        name: {
            type: 'string',
            description: 'Full name of the user'
        },
        email: {
            type: 'string',
            format: 'email',
            description: 'Email address'
        },
        age: {
            type: 'integer',
            description: 'User age in years'
        },
        isActive: {
            type: 'boolean',
            description: 'Whether the user account is active'
        },
        address: {
            type: 'object',
            description: 'User address information',
            properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                zipCode: { type: 'string' },
                country: { type: 'string' }
            }
        },
        tags: {
            type: 'array',
            description: 'User tags',
            items: { type: 'string' }
        },
        orders: {
            type: 'array',
            description: 'User orders',
            items: {
                type: 'object',
                properties: {
                    orderId: { type: 'string' },
                    total: { type: 'number' },
                    date: { type: 'string', format: 'date-time' }
                }
            }
        }
    }
};

const sampleUser: Json = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30,
    isActive: true,
    address: {
        street: '123 Main St',
        city: 'New York',
        zipCode: '10001',
        country: 'USA'
    },
    tags: ['premium', 'verified', 'newsletter'],
    orders: [
        {
            orderId: 'ORD-001',
            total: 99.99,
            date: '2024-01-15T10:30:00Z'
        },
        {
            orderId: 'ORD-002',
            total: 149.99,
            date: '2024-02-20T14:45:00Z'
        }
    ]
};

export const Default: Story = {
    args: {
        object: sampleUser,
        schema: userSchema,
    },
};

export const WithTimestamp: Story = {
    args: {
        object: sampleUser,
        schema: userSchema,
        timestamp: new Date('2024-02-21T12:00:00Z'),
    },
};

const simpleObject: Json = {
    title: 'Simple Object',
    count: 42,
    enabled: true,
    value: 3.14
};

const simpleSchema: JsonSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', description: 'The title' },
        count: { type: 'integer', description: 'A count value' },
        enabled: { type: 'boolean', description: 'Whether enabled' },
        value: { type: 'number', description: 'A numeric value' }
    }
};

export const SimpleObject: Story = {
    args: {
        object: simpleObject,
        schema: simpleSchema,
    },
};

const arrayData: Json = {
    items: ['apple', 'banana', 'orange', 'grape']
};

const arraySchema: JsonSchema = {
    type: 'object',
    properties: {
        items: {
            type: 'array',
            description: 'List of fruits',
            items: { type: 'string' }
        }
    }
};

export const WithArray: Story = {
    args: {
        object: arrayData,
        schema: arraySchema,
    },
};

const editableSchema: JsonSchema = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
        name: { type: 'string', description: 'Full name' },
        email: { type: 'string', format: 'email', description: 'Email address' },
        age: { type: 'integer', description: 'Age in years' },
        isActive: { type: 'boolean', description: 'Account is active' },
        website: { type: 'string', format: 'uri', description: 'Personal website' },
        birthDate: { type: 'string', format: 'date', description: 'Date of birth' },
        notes: {
            type: 'string',
            description: 'Long-form notes about this person (rendered as textarea when value is long)'
        }
    }
};

const editableObject: Json = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 28,
    isActive: true,
    website: 'https://example.com',
    birthDate: '1996-03-15',
    notes: 'This field is intentionally long to demonstrate the textarea input. It contains more than fifty characters.'
};

export const EditMode: Story = {
    render: () => {
        const [obj, setObj] = useState<Json>(editableObject);
        return (
            <ObjectContentEditor
                object={obj}
                schema={editableSchema}
                editMode
                onChange={setObj}
            />
        );
    }
};

export const EditModeWithValidation: Story = {
    render: () => {
        const [obj, setObj] = useState<Json>({ ...editableObject as object, name: '', email: 'not-an-email' });
        const [hasErrors, setHasErrors] = useState(false);
        return (
            <div className="p-4">
                <ObjectContentEditor
                    object={obj}
                    schema={editableSchema}
                    editMode
                    onChange={setObj}
                    onValidationChange={setHasErrors}
                />
                <div className="mt-4">
                    <button
                        className="p-button p-component"
                        disabled={hasErrors}
                        onClick={() => alert('Saved: ' + JSON.stringify(obj, null, 2))}
                    >
                        Save
                    </button>
                    {hasErrors && (
                        <span className="p-error ml-3">Please fix validation errors before saving.</span>
                    )}
                </div>
            </div>
        );
    }
};
