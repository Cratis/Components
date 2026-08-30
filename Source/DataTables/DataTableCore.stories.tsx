// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTableCore } from './DataTableCore';
import { Column } from './Column';

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

export const Empty: Story = {
    render: () => (
        <DataTableCore<Person> data={[]} emptyMessage='No people'>
            <Column<Person> field='name' header='Name' />
            <Column<Person> field='role' header='Role' />
        </DataTableCore>
    ),
};
