// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { DataPage, MenuItem } from './DataPage';
import { Column } from 'primereact/column';
import { QueryFor } from '@cratis/arc/queries';

const meta: Meta<typeof DataPage> = {
    title: 'DataPage/DataPage',
    component: DataPage,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof DataPage>;

// Mock data type
interface Person {
    id: number;
    name: string;
    email: string;
    role: string;
}

// Mock query
class PersonsQuery extends QueryFor<Person, object> {
    readonly route = '/api/persons';
    readonly routeTemplate = '/api/persons';
    readonly defaultValue: Person = { id: 0, name: '', email: '', role: '' };
    readonly parameterDescriptors = [];
    get requiredRequestParameters() {
        return [];
    }
    constructor() {
        super(Object, false);
    }
}

const PersonDetails = ({ item }: { item: Person }) => {
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Person Details</h2>
            <div className="space-y-2">
                <div>
                    <strong>ID:</strong> {item.id}
                </div>
                <div>
                    <strong>Name:</strong> {item.name}
                </div>
                <div>
                    <strong>Email:</strong> {item.email}
                </div>
                <div>
                    <strong>Role:</strong> {item.role}
                </div>
            </div>
        </div>
    );
};

export const Default: Story = {
    render: () => (
        <div style={{ height: '600px' }}>
            <DataPage<PersonsQuery, Person, object>
                title="Persons"
                query={PersonsQuery}
                emptyMessage="No persons found"
                dataKey="id"
                detailsComponent={PersonDetails}
                globalFilterFields={['name', 'email', 'role']}
            >
                <DataPage.MenuItems>
                    <MenuItem 
                        label="Add Person" 
                        icon={() => <i className="pi pi-plus" />}
                        command={() => alert('Add person clicked')}
                    />
                    <MenuItem 
                        label="Edit Person" 
                        icon={() => <i className="pi pi-pencil" />}
                        command={() => alert('Edit person clicked')}
                        disableOnUnselected
                    />
                    <MenuItem 
                        label="Delete Person" 
                        icon={() => <i className="pi pi-trash" />}
                        command={() => alert('Delete person clicked')}
                        disableOnUnselected
                    />
                </DataPage.MenuItems>
                <DataPage.Columns>
                    <Column field="id" header="ID" sortable style={{ width: '10%' }} />
                    <Column field="name" header="Name" sortable style={{ width: '30%' }} />
                    <Column field="email" header="Email" sortable style={{ width: '35%' }} />
                    <Column field="role" header="Role" sortable style={{ width: '25%' }} />
                </DataPage.Columns>
            </DataPage>
        </div>
    )
};

export const WithoutDetails: Story = {
    render: () => (
        <div style={{ height: '600px' }}>
            <DataPage<PersonsQuery, Person, object>
                title="Persons (No Details Panel)"
                query={PersonsQuery}
                emptyMessage="No persons found"
                dataKey="id"
                globalFilterFields={['name', 'email', 'role']}
            >
                <DataPage.MenuItems>
                    <MenuItem 
                        label="Refresh" 
                        icon={() => <i className="pi pi-refresh" />}
                        command={() => alert('Refresh clicked')}
                    />
                </DataPage.MenuItems>
                <DataPage.Columns>
                    <Column field="id" header="ID" sortable style={{ width: '10%' }} />
                    <Column field="name" header="Name" sortable style={{ width: '30%' }} />
                    <Column field="email" header="Email" sortable style={{ width: '35%' }} />
                    <Column field="role" header="Role" sortable style={{ width: '25%' }} />
                </DataPage.Columns>
            </DataPage>
        </div>
    )
};
