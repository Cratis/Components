// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TablePaginator } from './TablePaginator';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';

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
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
        await expect(canvas.getByText('3 / 5')).toBeVisible();

        await userEvent.click(canvas.getByRole('button', { name: 'Last page' }));
        await expect(canvas.getByText('5 / 5')).toBeVisible();
        await expect(canvas.getByRole('button', { name: 'Last page' })).toBeDisabled();

        await userEvent.click(canvas.getByRole('button', { name: 'First page' }));
        await expect(canvas.getByText('1 / 5')).toBeVisible();
        await expect(canvas.getByRole('button', { name: 'First page' })).toBeDisabled();
    },
};

export const PageLinks: Story = {
    args: { pageLinks: true },
    render: (args) => {
        const [shortPage, setShortPage] = useState(1);
        const [longPage, setLongPage] = useState(5);
        const [localizedPage, setLocalizedPage] = useState(5);
        return (
            <div style={{ display: 'grid', gap: '2rem' }}>
                <section aria-label='Short range'>
                    <h3>Five pages</h3>
                    <TablePaginator
                        {...args}
                        page={shortPage}
                        pageCount={5}
                        onPageChange={setShortPage}
                        ariaLabels={{ navigation: 'Pagination, five pages' }}
                    />
                </section>
                <section aria-label='Long range'>
                    <h3>Twelve pages with gaps</h3>
                    <TablePaginator
                        {...args}
                        page={longPage}
                        pageCount={12}
                        totalItems={240}
                        onPageChange={setLongPage}
                        ariaLabels={{ navigation: 'Pagination, twelve pages' }}
                    />
                </section>
                <section aria-label='Localized range'>
                    <h3>Localized labels and previous/next navigation</h3>
                    <CratisComponentsProvider
                        value={{
                            locale: 'es',
                            messages: {
                                paginator: {
                                    navigation: 'Paginación',
                                    first: 'Primera página',
                                    previous: 'Página anterior',
                                    next: 'Página siguiente',
                                    last: 'Última página',
                                    page: (number) => `Página ${number}`,
                                    pages: 'Páginas',
                                },
                            },
                        }}
                    >
                        <TablePaginator
                            {...args}
                            page={localizedPage}
                            pageCount={12}
                            totalItems={240}
                            onPageChange={setLocalizedPage}
                            pt={{
                                first: { root: { style: { display: 'none' } } },
                                last: { root: { style: { display: 'none' } } },
                                range: { style: { display: 'none' } },
                            }}
                        />
                    </CratisComponentsProvider>
                </section>
            </div>
        );
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const short = within(canvas.getByRole('region', { name: 'Short range' }));
        await userEvent.click(short.getByRole('button', { name: 'Page 3' }));
        await expect(short.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
            'aria-current',
            'page',
        );
        await expect(short.queryByText('…')).not.toBeInTheDocument();

        const long = within(canvas.getByRole('region', { name: 'Long range' }));
        await expect(long.getAllByText('…')).toHaveLength(2);
        await userEvent.click(long.getByRole('button', { name: 'Next page' }));
        await expect(long.getByRole('button', { name: 'Page 7' })).toHaveAttribute(
            'aria-current',
            'page',
        );

        const localized = within(canvas.getByRole('region', { name: 'Localized range' }));
        await expect(localized.getByRole('group', { name: 'Páginas' })).toBeVisible();
        await userEvent.click(localized.getByRole('button', { name: 'Página 7' }));
        await expect(localized.getByRole('button', { name: 'Página 7' })).toHaveAttribute(
            'aria-current',
            'page',
        );
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
