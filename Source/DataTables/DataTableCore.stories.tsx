// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTableCore, type DataTableCoreProps } from './DataTableCore';
import { Column } from './Column';
import { DataTableStatus } from './DataTableStatus';

interface Person {
    id: number;
    name: string;
    role: string;
}

const people: Person[] = [
    { id: 1, name: 'Sample Administrator', role: 'Administrator' },
    { id: 2, name: 'Example Developer', role: 'Developer' },
    { id: 3, name: 'Demo Viewer', role: 'Viewer' },
];

const meta = {
    title: 'DataTables/DataTableCore',
    component: DataTableCore,
    args: { data: [], emptyMessage: 'No people' },
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof DataTableCore>;

export default meta;
type Story = StoryObj<typeof meta>;

const LocalTable = () => {
    const [selection, setSelection] = useState<Person | undefined>(people[1]);
    return (
        <DataTableCore<Person>
            data={people}
            dataKey='id'
            emptyMessage='No people'
            selectionMode='single'
            selection={selection}
            onSelectionChange={(event) => setSelection(event.value ?? undefined)}
            globalFilterFields={['name', 'role']}
            globalSearchPlaceholder='Search people'
            globalSearchAriaLabel='Search people'
        >
            <Column<Person> selectionMode='single' header='Select' />
            <Column<Person> field='name' header='Name' sortable />
            <Column<Person> field='role' header='Role' filter />
        </DataTableCore>
    );
};

export const LoadedArray: Story = {
    render: () => <LocalTable />,
};

const MultipleSelectionTable = () => {
    const [selected, setSelected] = useState<Person[]>([people[1]]);
    return (
        <DataTableCore<Person>
            data={people}
            dataKey='id'
            emptyMessage='No people'
            selectionMode='multiple'
            selectedItems={selected}
            onSelectedItemsChange={setSelected}
            globalFilterFields={['name', 'role']}
        >
            <Column<Person> selectionMode='multiple' />
            <Column<Person> field='name' header='Name' sortable />
            <Column<Person>
                field='role'
                header='Role'
                filter
                filterOptions={[
                    { label: 'Administrator', value: 'Administrator' },
                    { label: 'Developer', value: 'Developer' },
                    { label: 'Viewer', value: 'Viewer' },
                ]}
            />
        </DataTableCore>
    );
};

/** Bulk selection: a checkbox per row, and a select-all that covers the rows the filter leaves visible. */
export const MultipleSelection: Story = {
    render: () => <MultipleSelectionTable />,
};

export const QueryStates: Story = {
    render: () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {([DataTableStatus.Loading, DataTableStatus.Failed, DataTableStatus.Unauthorized, DataTableStatus.Ready] as const).map((status) => (
                <div key={status}>
                    <h3>{status}</h3>
                    <DataTableCore<Person> data={[]} status={status} emptyMessage='No people'>
                        <Column<Person> field='name' header='Name' />
                    </DataTableCore>
                </div>
            ))}
            <div>
                <h3>Refetching with rows</h3>
                <DataTableCore<Person> data={people} status={DataTableStatus.Loading} emptyMessage='No people'>
                    <Column<Person> field='name' header='Name' />
                </DataTableCore>
            </div>
        </div>
    ),
};

interface MobileProject {
    id: string;
    name: string;
    details: { status: string };
    notes?: string;
}
const mobileProjects: MobileProject[] = [
    { id: 'example-1', name: 'Example Project', details: { status: 'Ready' }, notes: 'A long synthetic description that wraps within a narrow card without hiding the column label or the body action.' },
    { id: 'example-2', name: 'Demo Project', details: { status: 'Draft' } },
];
const mobileArgs: DataTableCoreProps<MobileProject> = {
    data: mobileProjects, dataKey: 'id', emptyMessage: 'No projects.', mobileLayout: 'cards',
    selectionMode: 'multiple', globalFilterFields: ['name'],
};
const mobileColumns = [
    <Column key='name' field='name' header={<strong>Project</strong>} sortable filter />,
    <Column key='status' field='details.status' header='Status' />,
    <Column key='notes' field='notes' header='Notes' />,
    <Column<MobileProject> key='action' header='Action' body={row => <a href={`#${row.id}`}>Open project</a>} />,
];

/** Resize across 640px; search, selection and controls retain their state. */
export const MobileCards: Story = {
    render: function MobileCardsExample() {
        const [selectedItems, setSelectedItems] = useState<MobileProject[]>([]);
        return <DataTableCore {...mobileArgs} selectedItems={selectedItems} onSelectedItemsChange={setSelectedItems}>{mobileColumns}</DataTableCore>;
    },
};
export const MobileLoading: Story = { render: () => <DataTableCore {...mobileArgs} data={[]} status={DataTableStatus.Loading}>{mobileColumns}</DataTableCore> };
export const MobileRefetch: Story = { render: () => <DataTableCore {...mobileArgs} status={DataTableStatus.Loading}>{mobileColumns}</DataTableCore> };
export const MobileFailed: Story = { render: () => <DataTableCore {...mobileArgs} status={DataTableStatus.Failed}>{mobileColumns}</DataTableCore> };
export const MobileUnauthorized: Story = { render: () => <DataTableCore {...mobileArgs} status={DataTableStatus.Unauthorized}>{mobileColumns}</DataTableCore> };
export const MobileEmpty: Story = { render: () => <DataTableCore {...mobileArgs} data={[]}>{mobileColumns}</DataTableCore> };
export const MobileFilteredEmpty: Story = { render: () => <DataTableCore {...mobileArgs} globalFilter='Unmatched'>{mobileColumns}</DataTableCore> };

export const Empty: Story = {
    render: () => (
        <DataTableCore<Person> data={[]} emptyMessage='No people'>
            <Column<Person> field='name' header='Name' />
            <Column<Person> field='role' header='Role' />
        </DataTableCore>
    ),
};
