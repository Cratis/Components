// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Meta, StoryObj } from '@storybook/react';
import React from 'react';
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
    { id: 6, name: 'Fiona Lee', age: 33, department: 'Human Resources', address: { street: '852 Cedar St', city: 'Seattle', zipCode: '98103' } },
    { id: 7, name: 'George Miller', age: 27, department: 'Support', address: { street: '147 Birch Ln', city: 'Portland', zipCode: '97204' } },
    { id: 8, name: 'Hannah Davis', age: 45, department: 'Finance', address: { street: '963 Walnut Ave', city: 'San Francisco', zipCode: '94103' } },
    { id: 9, name: 'Isaac Newton', age: 38, department: 'Research', address: { street: '753 Spruce Rd', city: 'Austin', zipCode: '73301' } },
];

export const Default: Story = {
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
            <div className="storybook-wrapper" style={{ height: 'calc(100vh - 2rem)', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start' }}>
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
                    cardRenderer={(item) => ({
                        title: item.name,
                        labels: ['Age', 'Department', 'City'],
                        values: [String(item.age), item.department, item.address.city],
                    })}
                    // Example: override a couple of theme variables
                    colors={{
                        primaryColor: '#91BDF8',
                        primary500: '#2E66BA',
                    }}
                    // Example: custom content inside the built-in detail drawer
                    detailRenderer={(item, onClose) => (
                        <section>
                            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                                    <p style={{ margin: 0, opacity: 0.8 }}>Department • {item.department}</p>
                                </div>
                                <button type="button" onClick={onClose} title="Close" className="p-button p-button-text">
                                    Close
                                </button>
                            </header>
                            <dl style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.35rem 0.75rem' }}>
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
                    )}
                    getItemId={(item) => item.id}
                />
            </div>
        );
    },
};