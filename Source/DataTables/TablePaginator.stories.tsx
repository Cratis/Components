// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { TablePaginator } from './TablePaginator';

const meta = {
    title: 'DataTables/TablePaginator',
    component: TablePaginator,
    args: {
        page: 1,
        pageCount: 5,
        pageSize: 20,
        totalItems: 93,
        onPageChange: fn(),
    },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof TablePaginator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interactive: Story = {
    render: (args) => {
        const [page, setPage] = useState(args.page);
        return <TablePaginator {...args} page={page} onPageChange={setPage} />;
    },
};

export const LocalizedAndCustomized: Story = {
    args: {
        ariaLabels: {
            navigation: 'Sidenavigasjon',
            first: 'Første side',
            previous: 'Forrige side',
            next: 'Neste side',
            last: 'Siste side',
        },
        pt: {
            root: {
                style: {
                    border: '1px solid var(--cratis-surface-border)',
                    borderRadius: '0.5rem',
                },
            },
            range: { style: { fontWeight: 700 } },
        },
    },
};
