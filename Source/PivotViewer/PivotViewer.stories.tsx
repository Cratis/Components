// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { PivotViewer } from './PivotViewer';

const meta: Meta<typeof PivotViewer> = {
    title: 'PivotViewer/PivotViewer',
    component: PivotViewer,
};

export default meta;
type Story = StoryObj<typeof PivotViewer>;

// Sample data types for demonstration
interface Address {
    street: string;
    city: string;
    zipCode: string;
}

interface Person {
    id: number;
    name: string;
    age: number;
    department: string;
    address: Address;
}

const sampleData: Person[] = [
    { id: 1, name: 'Alice Johnson', age: 28, department: 'Engineering', address: { street: '123 Main St', city: 'Seattle', zipCode: '98101' } },
    { id: 2, name: 'Bob Smith', age: 35, department: 'Marketing', address: { street: '456 Oak Ave', city: 'Portland', zipCode: '97201' } },
    { id: 3, name: 'Charlie Brown', age: 42, department: 'Engineering', address: { street: '789 Pine Rd', city: 'Seattle', zipCode: '98102' } },
    { id: 4, name: 'Diana Prince', age: 31, department: 'Sales', address: { street: '321 Elm St', city: 'San Francisco', zipCode: '94102' } },
    { id: 5, name: 'Edward Norton', age: 29, department: 'Engineering', address: { street: '654 Maple Dr', city: 'Portland', zipCode: '97202' } },
];

export const Default: Story = {
    args: {
        data: [],
        dimensions: [],
    },
    render: (args) => (
        <div className="storybook-wrapper" >
            <PivotViewer {...args} data={[]} dimensions={[]} />
        </div>
    )
};

export const WithTypeSafeSearch: Story = {
    render: () => {
        const dimensions = [
            {
                key: 'department',
                label: 'Department',
                getValue: (item: Person) => item.department,
            },
            {
                key: 'city',
                label: 'City',
                getValue: (item: Person) => item.address.city,
            },
        ];
        
        const filters = [
            {
                key: 'age',
                label: 'Age',
                getValue: (item: Person) => item.age,
                type: 'number' as const,
            },
        ];
        
        return (
            <div className="storybook-wrapper" style={{ height: '600px', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start' }}>
                <PivotViewer<Person>
                    data={sampleData}
                    dimensions={dimensions}
                    filters={filters}
                    // Type-safe search fields with support for nested properties
                    searchFields={[
                        (item) => item.name,
                        (item) => item.department,
                        (item) => item.address.city,
                        (item) => item.address.street,
                    ]}
                    cardRenderer={(item) => (
                        <div style={{ padding: '8px' }}>
                            <h3>{item.name}</h3>
                            <p>Age: {item.age}</p>
                            <p>Department: {item.department}</p>
                            <p>{item.address.city}</p>
                        </div>
                    )}
                    // Example: override a couple of theme variables
                    colors={{
                        primaryColor: '#91BDF8',
                        primary500: '#2E66BA',
                    }}
                    // Example: custom details renderer shown on card selection
                    detailRenderer={(item, onClose) => (
                        <aside className="pv-detail-panel">
                            <header>
                                <div>
                                    <h2>{item.name}</h2>
                                    <p>Department • {item.department}</p>
                                </div>
                                <button type="button" onClick={onClose} title="Close">×</button>
                            </header>
                            <div className="pv-detail-panel-content">
                                <section>
                                    <h3>Profile</h3>
                                    <dl>
                                        <div>
                                            <dt>Age</dt>
                                            <dd>{item.age}</dd>
                                        </div>
                                        <div>
                                            <dt>City</dt>
                                            <dd>{item.address.city}</dd>
                                        </div>
                                        <div>
                                            <dt>Street</dt>
                                            <dd>{item.address.street}</dd>
                                        </div>
                                    </dl>
                                </section>
                            </div>
                        </aside>
                    )}
                    getItemId={(item) => item.id}
                />
            </div>
        );
    },
};