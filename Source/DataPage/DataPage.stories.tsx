// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { DataPage, MenuItem } from './DataPage';
import { Column } from '../DataTables/Column';
import { QueryFor, QueryResult } from '@cratis/arc/queries';

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

const mockPersons: Person[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
    { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Viewer' },
    { id: 4, name: 'David Brown', email: 'david@example.com', role: 'Editor' },
    { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'Admin' },
    { id: 6, name: 'Frank Miller', email: 'frank@example.com', role: 'Viewer' },
    { id: 7, name: 'Grace Wilson', email: 'grace@example.com', role: 'Editor' },
    { id: 8, name: 'Henry Taylor', email: 'henry@example.com', role: 'Viewer' },
];

// Mock query — overrides perform() to return static data instead of making HTTP calls
class PersonsQuery extends QueryFor<Person, object> {
    readonly route = '/api/persons';
    readonly routeTemplate = '/api/persons';
    readonly defaultValue: Person = [] as unknown as Person;
    readonly parameterDescriptors = [];
    get requiredRequestParameters() {
        return [];
    }
    constructor() {
        super(Object, true);
    }
    override perform(): Promise<QueryResult<Person>> {
        return Promise.resolve({
            data: mockPersons,
            paging: { totalItems: mockPersons.length, totalPages: 1, page: 0, size: mockPersons.length },
            isSuccess: true,
            isAuthorized: true,
            isValid: true,
            hasExceptions: false,
            validationResults: [],
            exceptionMessages: [],
            exceptionStackTrace: '',
        } as unknown as QueryResult<Person>);
    }
}

const manyPersons: Person[] = Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    name: `Person ${index + 1}`,
    email: `person${index + 1}@example.com`,
    role: ['Admin', 'Editor', 'Viewer'][index % 3],
}));

// Mock query with more records than fit on a page, so the paginator is real and
// the row region has to scroll. This is the shape that shows whether the page
// keeps its paginator inside the height it was given.
class ManyPersonsQuery extends QueryFor<Person, object> {
    readonly route = '/api/many-persons';
    readonly routeTemplate = '/api/many-persons';
    readonly defaultValue: Person = [] as unknown as Person;
    readonly parameterDescriptors = [];
    get requiredRequestParameters() {
        return [];
    }
    constructor() {
        super(Object, true);
    }
    override perform(): Promise<QueryResult<Person>> {
        const page = this.paging?.page ?? 0;
        const size = this.paging?.pageSize ?? 20;
        const first = page * size;

        return Promise.resolve({
            data: manyPersons.slice(first, first + size),
            paging: { totalItems: manyPersons.length, totalPages: Math.ceil(manyPersons.length / size), page, size },
            isSuccess: true,
            isAuthorized: true,
            isValid: true,
            hasExceptions: false,
            validationResults: [],
            exceptionMessages: [],
            exceptionStackTrace: '',
        } as unknown as QueryResult<Person>);
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

export const WithClientFiltering: Story = {
    render: () => (
        <div style={{ height: '600px' }}>
            <DataPage<PersonsQuery, Person, object>
                title="Persons (Client-Side Filtering)"
                query={PersonsQuery}
                emptyMessage="No persons found"
                dataKey="id"
                clientFiltering
                globalFilterFields={['name', 'email', 'role']}
            >
                <DataPage.Columns>
                    <Column field="id" header="ID" sortable style={{ width: '10%' }} />
                    <Column field="name" header="Name" sortable filter filterPlaceholder="Filter by name" style={{ width: '30%' }} />
                    <Column field="email" header="Email" sortable filter filterPlaceholder="Filter by email" style={{ width: '35%' }} />
                    <Column field="role" header="Role" sortable filter filterPlaceholder="Filter by role" style={{ width: '25%' }} />
                </DataPage.Columns>
            </DataPage>
        </div>
    )
};

const PersonDetailsWithRefresh = ({ item, onRefresh }: { item: Person; onRefresh?: () => void }) => {
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Person Details</h2>
            <div className="space-y-2 mb-4">
                <div><strong>Name:</strong> {item.name}</div>
                <div><strong>Email:</strong> {item.email}</div>
                <div><strong>Role:</strong> {item.role}</div>
            </div>
            <button
                className="p-button p-component"
                onClick={() => {
                    alert(`Saved changes for ${item.name}`);
                    onRefresh?.();
                }}
            >
                Save &amp; Refresh
            </button>
        </div>
    );
};

export const WithOnRefresh: Story = {
    render: () => (
        <div style={{ height: '600px' }}>
            <DataPage<PersonsQuery, Person, object>
                title="Persons (With Refresh Callback)"
                query={PersonsQuery}
                emptyMessage="No persons found"
                dataKey="id"
                detailsComponent={PersonDetailsWithRefresh as React.FC<{ item: unknown }>}
                onRefresh={() => alert('onRefresh triggered — reload your data here')}
            >
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

/**
 * 24 records at a page size of 20 in a 560px container — more rows than fit,
 * so the paginator has to stay on screen while the row region scrolls on its
 * own. Page to the short second page and back: the paginator must not move.
 */
export const MultiplePages: Story = {
    render: () => (
        <div style={{ height: '560px' }}>
            <DataPage<ManyPersonsQuery, Person, object>
                title="Persons (24 records, 20 per page)"
                query={ManyPersonsQuery}
                emptyMessage="No persons found"
                dataKey="id"
                globalFilterFields={['name', 'email', 'role']}
            >
                <DataPage.MenuItems>
                    <MenuItem
                        label="Add Person"
                        icon={() => <i className="pi pi-plus" />}
                        command={() => alert('Add person clicked')}
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

/**
 * The same overflowing data with no action bar, so the table region is the only
 * item in the column and still has to leave room for the paginator.
 */
export const MultiplePagesWithoutMenuItems: Story = {
    render: () => (
        <div style={{ height: '560px' }}>
            <DataPage<ManyPersonsQuery, Person, object>
                title="Persons (24 records, no action bar)"
                query={ManyPersonsQuery}
                emptyMessage="No persons found"
                dataKey="id"
            >
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

/**
 * The overflowing data with a details pane — select a row to split the page, then drag the
 * divider between the panes. The paginator stays inside the primary pane's bounds at every
 * split, and the two panes sit side by side rather than stacking.
 */
export const MultiplePagesWithDetails: Story = {
    render: () => (
        <div style={{ height: '560px' }}>
            <DataPage<ManyPersonsQuery, Person, object>
                title="Persons (24 records, with details)"
                query={ManyPersonsQuery}
                emptyMessage="No persons found"
                dataKey="id"
                detailsComponent={PersonDetails}
            >
                <DataPage.MenuItems>
                    <MenuItem
                        label="Edit Person"
                        icon={() => <i className="pi pi-pencil" />}
                        command={() => alert('Edit person clicked')}
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
