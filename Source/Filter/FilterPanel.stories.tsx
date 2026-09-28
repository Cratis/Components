// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FilterPanel } from './FilterPanel';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import { FilterEditor } from './FilterEditor';
import { useFilterState } from './useFilterState';
import type { FilterDefinition } from './types';

const meta: Meta<typeof FilterPanel> = {
    title: 'Filter/FilterPanel',
    component: FilterPanel,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof FilterPanel>;

const openFilterGroup = async (
    canvasElement: HTMLElement,
    triggerName: string,
    groupName: string,
) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: triggerName }));
    const body = within(document.body);
    const findGroup = () =>
        body
            .getAllByRole('button', { name: groupName })
            .find((button) => button.hasAttribute('aria-expanded'));
    await body.findAllByRole('button', { name: groupName });
    const group = findGroup();
    if (!group) throw new Error(`Could not find the ${groupName} filter group trigger.`);
    if (group.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(group);
    }
    await waitFor(() => expect(findGroup()).toHaveAttribute('aria-expanded', 'true'));
    const panel = group.closest('[role="dialog"]');
    const content = group.closest('.pv-filter')?.querySelector('.pv-filter-content');
    await waitFor(() => {
        expect(panel ? getComputedStyle(panel).opacity : '').toBe('1');
        expect(content ? getComputedStyle(content).opacity : '').toBe('1');
    }, { timeout: 5000 });
    return { body, canvas };
};

// ---------------------------------------------------------------------------
// Shared wrapper styles
// ---------------------------------------------------------------------------

const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--cratis-surface-ground, #0d0d1a)',
    color: 'var(--cratis-text-color, #e2e8f0)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    colorScheme: 'dark',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
};

const buttonStyle: React.CSSProperties = {
    appearance: 'none',
    border: '1px solid var(--cratis-surface-border, #334155)',
    borderRadius: '999px',
    padding: '0.45rem 1.25rem',
    background: 'var(--cratis-highlight-bg, rgba(255,255,255,0.06))',
    color: 'var(--cratis-text-color, #e2e8f0)',
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'background 180ms ease',
};

const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'var(--cratis-primary-color, #3b82f6)',
    color: 'var(--cratis-primary-color-text, #fff)',
};

// ---------------------------------------------------------------------------
// Story: Single-select string filter
// ---------------------------------------------------------------------------

export const SingleSelectFilter: Story = {
    name: 'Single-select string filter',
    play: async ({ canvasElement }) => {
        const { body, canvas } = await openFilterGroup(canvasElement, 'Status', 'Status');
        const active = await body.findByRole('radio', { name: /^Active/ });
        await userEvent.click(active);
        await expect(active).toBeChecked();
        await expect(canvas.getByRole('button', { name: 'Status (1)' })).toBeTruthy();
        await userEvent.click(body.getByRole('button', { name: 'Clear filter' }));
        await expect(active).not.toBeChecked();
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = useMemo(() => [
            {
                key: 'status',
                label: 'Status',
                type: 'string',
                options: [
                    { key: 'active', label: 'Active', value: 'active', count: 42 },
                    { key: 'inactive', label: 'Inactive', value: 'inactive', count: 18 },
                    { key: 'pending', label: 'Pending', value: 'pending', count: 7 },
                    { key: 'archived', label: 'Archived', value: 'archived', count: 3 },
                ],
            },
        ], []);

        const {
            filterValues,
            rangeValues,
            expandedFilterKey,
            setExpandedFilterKey,
            handleToggleFilter,
            handleClearFilter,
            handleRangeChange,
        } = useFilterState(filters);

        const activeCount = (filterValues['status']?.size ?? 0);

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                        Single-select Filter
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Radio-button style — only one option can be selected at a time.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        ref={buttonRef}
                        style={isOpen ? activeButtonStyle : buttonStyle}
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        Status{activeCount > 0 ? ` (${activeCount})` : ''}
                    </button>
                    {activeCount > 0 && (
                        <span style={{ fontSize: '0.85rem' }}>
                            Selected:{' '}
                            {Array.from(filterValues['status'] ?? []).join(', ')}
                        </span>
                    )}
                </div>
                <FilterPanel
                    isOpen={isOpen}
                    filters={filters}
                    filterValues={filterValues}
                    rangeValues={rangeValues}
                    expandedFilterKey={expandedFilterKey}
                    anchorRef={buttonRef}
                    onClose={() => setIsOpen(false)}
                    onFilterToggle={handleToggleFilter}
                    onFilterClear={handleClearFilter}
                    onRangeChange={handleRangeChange}
                    onExpandedFilterChange={setExpandedFilterKey}
                />
            </div>
        );
    },
};

// ---------------------------------------------------------------------------
// Story: Provider-localized filter names
// ---------------------------------------------------------------------------

export const ProviderLocalizedNames: Story = {
    name: 'Provider-localized names',
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open filters' }));
        const panel = await within(document.body).findByRole('dialog', { name: 'Filtre' });
        const panelSearch = panel.querySelector<HTMLElement>('.pv-search');
        await expect(within(panelSearch!).getByRole('searchbox', { name: 'Søk i filtre' })).toBeTruthy();
        await userEvent.click(within(panel).getByRole('button', { name: 'Status' }));
        const groupSearch = panel.querySelector<HTMLElement>('.pv-filter-group-search');
        await expect(within(groupSearch!).getByRole('searchbox', { name: 'Søk i filtre' })).toBeTruthy();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(within(document.body).queryByRole('dialog', { name: 'Filtre' })).toBeNull());
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);
        const filters: FilterDefinition[] = [
            { key: 'status', label: 'Status', searchable: true, options: [
                { key: 'active', label: 'Active', value: 'active' },
            ] },
        ];
        return (
            <CratisComponentsProvider
                value={{ messages: { filter: { label: 'Filtre', searchAriaLabel: 'Søk i filtre' } } }}
                overlayEnvironment={{ getContainer: () => document.getElementById('localized-filter-overlay') }}>
                <div style={{ ...pageStyle, '--cratis-surface-card': '#0d0d1a',
                    '--cratis-surface-ground': '#0d0d1a', '--cratis-surface-section': '#172033',
                    '--cratis-surface-overlay': '#172033', '--cratis-text-color': '#e2e8f0',
                    '--cratis-text-color-secondary': '#cbd5e1' } as React.CSSProperties}>
                    <div id='localized-filter-overlay' />
                    <button ref={buttonRef} style={{ ...buttonStyle, background: '#172033', color: '#e2e8f0' }}
                        onClick={() => setIsOpen((open) => !open)}>
                        Open filters
                    </button>
                    <FilterPanel isOpen={isOpen} filters={filters} filterValues={{}} rangeValues={{}}
                        searchPlaceholder='Find filters' onSearchChange={() => undefined}
                        anchorRef={buttonRef} onClose={() => setIsOpen(false)}
                        onFilterToggle={() => undefined} onFilterClear={() => undefined}
                        onRangeChange={() => undefined} onExpandedFilterChange={() => undefined} />
                </div>
            </CratisComponentsProvider>
        );
    },
};

// ---------------------------------------------------------------------------
// Story: Multi-select string filter
// ---------------------------------------------------------------------------

export const MultiSelectFilter: Story = {
    name: 'Multi-select string filter',
    play: async ({ canvasElement }) => {
        const { body, canvas } = await openFilterGroup(
            canvasElement,
            'Department',
            'Department',
        );
        const engineering = await body.findByRole('checkbox', { name: /^Engineering/ });
        const design = body.getByRole('checkbox', { name: /^Design/ });
        await userEvent.click(engineering);
        await userEvent.click(design);
        await expect(engineering).toBeChecked();
        await expect(design).toBeChecked();
        await expect(canvas.getByRole('button', { name: 'Department (2)' })).toBeTruthy();
        await userEvent.click(body.getByRole('button', { name: 'Clear filter' }));
        await expect(engineering).not.toBeChecked();
        await expect(design).not.toBeChecked();
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = useMemo(() => [
            {
                key: 'department',
                label: 'Department',
                type: 'string',
                multi: true,
                options: [
                    { key: 'engineering', label: 'Engineering', value: 'engineering', count: 120 },
                    { key: 'product', label: 'Product', value: 'product', count: 45 },
                    { key: 'design', label: 'Design', value: 'design', count: 32 },
                    { key: 'marketing', label: 'Marketing', value: 'marketing', count: 28 },
                    { key: 'sales', label: 'Sales', value: 'sales', count: 67 },
                    { key: 'finance', label: 'Finance', value: 'finance', count: 19 },
                    { key: 'hr', label: 'Human Resources', value: 'hr', count: 14 },
                    { key: 'legal', label: 'Legal', value: 'legal', count: 8 },
                ],
            },
        ], []);

        const { filterValues, rangeValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange } =
            useFilterState(filters);

        const activeCount = filterValues['department']?.size ?? 0;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                        Multi-select Filter
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Checkbox style — multiple options can be selected simultaneously.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        ref={buttonRef}
                        style={isOpen ? activeButtonStyle : buttonStyle}
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        Department{activeCount > 0 ? ` (${activeCount})` : ''}
                    </button>
                    {activeCount > 0 && (
                        <span style={{ fontSize: '0.85rem' }}>
                            Selected:{' '}
                            {Array.from(filterValues['department'] ?? []).join(', ')}
                        </span>
                    )}
                </div>
                <FilterPanel
                    isOpen={isOpen}
                    filters={filters}
                    filterValues={filterValues}
                    rangeValues={rangeValues}
                    expandedFilterKey={expandedFilterKey}
                    anchorRef={buttonRef}
                    onClose={() => setIsOpen(false)}
                    onFilterToggle={handleToggleFilter}
                    onFilterClear={handleClearFilter}
                    onRangeChange={handleRangeChange}
                    onExpandedFilterChange={setExpandedFilterKey}
                />
            </div>
        );
    },
};

// ---------------------------------------------------------------------------
// Story: Numeric range filter with histogram
// ---------------------------------------------------------------------------

function generateAgeValues(count: number): number[] {
    const values: number[] = [];
    // Bell-curve-ish distribution centred around 35
    for (let i = 0; i < count; i++) {
        const u = Math.random() + Math.random() + Math.random() + Math.random();
        values.push(Math.round(20 + (u / 4) * 40));
    }
    return values;
}

const ageValues = generateAgeValues(500);

export const NumericRangeFilter: Story = {
    name: 'Numeric range filter (histogram)',
    play: async ({ canvasElement }) => {
        const { body, canvas } = await openFilterGroup(canvasElement, 'Age', 'Age');
        await userEvent.click(await body.findByRole('button', { name: /^20 - 22:/ }));
        await expect(canvas.getByRole('button', { name: 'Age: 20–22' })).toBeTruthy();
        await userEvent.click(body.getByRole('button', { name: 'Clear range' }));
        await expect(canvas.getByRole('button', { name: 'Age' })).toBeTruthy();
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = useMemo(() => [
            {
                key: 'age',
                label: 'Age',
                type: 'number',
                buckets: 20,
                numericRange: {
                    min: 20,
                    max: 60,
                    values: ageValues,
                },
            },
        ], []);

        const { filterValues, rangeValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange } =
            useFilterState(filters);

        const range = rangeValues['age'];

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                        Numeric Range Filter
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Histogram with draggable range handles. Click a bar to jump-select
                        that bucket.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        ref={buttonRef}
                        style={range ? activeButtonStyle : buttonStyle}
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        Age{range ? `: ${Math.round(range[0])}–${Math.round(range[1])}` : ''}
                    </button>
                </div>
                <FilterPanel
                    isOpen={isOpen}
                    filters={filters}
                    filterValues={filterValues}
                    rangeValues={rangeValues}
                    expandedFilterKey={expandedFilterKey}
                    anchorRef={buttonRef}
                    onClose={() => setIsOpen(false)}
                    onFilterToggle={handleToggleFilter}
                    onFilterClear={handleClearFilter}
                    onRangeChange={handleRangeChange}
                    onExpandedFilterChange={setExpandedFilterKey}
                />
            </div>
        );
    },
};

// ---------------------------------------------------------------------------
// Story: Custom filter editor
// ---------------------------------------------------------------------------

function RatingEditor({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
    const rating = typeof value === 'number' ? value : 0;
    return (
        <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type='button'
                        aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                        aria-pressed={rating === star}
                        onClick={() => onChange(rating === star ? 0 : star)}
                        style={{
                            appearance: 'none',
                            border: 'none',
                            background: 'none',
                            fontSize: '1.4rem',
                            cursor: 'pointer',
                            color: star <= rating
                                ? 'var(--cratis-primary-color, #3b82f6)'
                                : 'var(--cratis-surface-border, #334155)',
                            transition: 'color 120ms ease, transform 120ms ease',
                            padding: '0',
                            lineHeight: 1,
                        }}
                        title={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
}

function DateRangeEditor({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
    const range = value as { from?: string; to?: string } | undefined;
    return (
        <div style={{ padding: '0.5rem 0' }}>
            <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}
            >
                <label
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                    }}
                >
                    From
                    <input
                        type="date"
                        value={range?.from ?? ''}
                        onChange={(e) => onChange({ ...range, from: e.target.value || undefined })}
                        style={{
                            padding: '0.4rem 0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--cratis-surface-border, #334155)',
                            background: 'var(--cratis-surface-ground, #0d0d1a)',
                            color: 'inherit',
                            fontSize: '0.85rem',
                        }}
                    />
                </label>
                <label
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                    }}
                >
                    To
                    <input
                        type="date"
                        value={range?.to ?? ''}
                        onChange={(e) => onChange({ ...range, to: e.target.value || undefined })}
                        style={{
                            padding: '0.4rem 0.5rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--cratis-surface-border, #334155)',
                            background: 'var(--cratis-surface-ground, #0d0d1a)',
                            color: 'inherit',
                            fontSize: '0.85rem',
                        }}
                    />
                </label>
            </div>
        </div>
    );
}

export const CustomEditor: Story = {
    name: 'Custom filter editor',
    play: async ({ canvasElement }) => {
        const { body, canvas } = await openFilterGroup(
            canvasElement,
            'Filters',
            'Rating',
        );
        await userEvent.click(await body.findByRole('button', { name: '4 stars' }));
        await expect(canvas.getByText(/Rating ≥ 4/)).toBeTruthy();
        await userEvent.click(body.getByRole('button', { name: 'Clear filter' }));
        await expect(canvas.queryByText(/Rating ≥ 4/)).toBeNull();
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = useMemo(() => [
            {
                key: 'rating',
                label: 'Rating',
                type: 'custom',
            },
            {
                key: 'createdAt',
                label: 'Created Date',
                type: 'custom',
            },
        ], []);

        const { filterValues, rangeValues, customValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange, handleCustomValueChange } =
            useFilterState(filters);

        const rating = customValues['rating'];
        const dateRange = customValues['createdAt'] as { from?: string; to?: string } | undefined;
        const hasFilters = (typeof rating === 'number' && rating > 0) || dateRange?.from || dateRange?.to;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                        Custom Filter Editors
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Declare a{' '}
                        <code style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>
                            &lt;FilterEditor&gt;
                        </code>{' '}
                        child inside{' '}
                        <code style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>
                            &lt;FilterPanel&gt;
                        </code>{' '}
                        to provide a custom editor for any filter group.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        ref={buttonRef}
                        style={hasFilters ? activeButtonStyle : buttonStyle}
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        Filters{hasFilters ? ' •' : ''}
                    </button>
                    {hasFilters && (
                        <span style={{ fontSize: '0.85rem' }}>
                            {typeof rating === 'number' &&
                                rating > 0 &&
                                `Rating ≥ ${rating} ★`}
                            {dateRange?.from && ` · From ${dateRange.from}`}
                            {dateRange?.to && ` · To ${dateRange.to}`}
                        </span>
                    )}
                </div>
                <FilterPanel
                    isOpen={isOpen}
                    filters={filters}
                    filterValues={filterValues}
                    rangeValues={rangeValues}
                    customValues={customValues}
                    expandedFilterKey={expandedFilterKey}
                    anchorRef={buttonRef}
                    onClose={() => setIsOpen(false)}
                    onFilterToggle={handleToggleFilter}
                    onFilterClear={handleClearFilter}
                    onRangeChange={handleRangeChange}
                    onExpandedFilterChange={setExpandedFilterKey}
                    onCustomValueChange={handleCustomValueChange}
                >
                    <FilterEditor filterKey="rating">
                        {({ value, onChange }) => (
                            <RatingEditor value={value} onChange={onChange} />
                        )}
                    </FilterEditor>
                    <FilterEditor filterKey="createdAt">
                        {({ value, onChange }) => (
                            <DateRangeEditor value={value} onChange={onChange} />
                        )}
                    </FilterEditor>
                </FilterPanel>
            </div>
        );
    },
};

// ---------------------------------------------------------------------------
// Story: Mixed filter types (all types together)
// ---------------------------------------------------------------------------

const salaryValues = Array.from({ length: 300 }, () => {
    const u = Math.random() + Math.random() + Math.random();
    return Math.round(40_000 + (u / 3) * 160_000);
});

export const MixedFilters: Story = {
    name: 'Mixed filter types',
    play: async ({ canvasElement }) => {
        const { body, canvas } = await openFilterGroup(
            canvasElement,
            'Filters',
            'Department',
        );
        // Department's own option list also has room to show a search box now (five options
        // is enough to overflow the list's fixed-height box), and it shares this panel's
        // placeholder text by design (see for_FilterPanel/when_a_filter_group_has_no_own_search_placeholder.tsx)
        // - so scope to .pv-search, the panel's own top search, rather than matching either box.
        const panelSearch = within(
            document.body.querySelector('.pv-search') as HTMLElement,
        );
        const search = panelSearch.getByPlaceholderText('Search filters…');
        await userEvent.type(search, 'department');
        await expect(search).toHaveValue('department');
        const engineering = await body.findByRole('checkbox', { name: /^Engineering/ });
        await userEvent.click(engineering);
        await expect(engineering).toBeChecked();
        await expect(canvas.getByRole('button', { name: 'Filters (1)' })).toBeTruthy();
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState('');

        const filters: FilterDefinition[] = useMemo(() => [
            {
                key: 'department',
                label: 'Department',
                type: 'string',
                multi: true,
                options: [
                    { key: 'engineering', label: 'Engineering', value: 'engineering', count: 120 },
                    { key: 'product', label: 'Product', value: 'product', count: 45 },
                    { key: 'design', label: 'Design', value: 'design', count: 32 },
                    { key: 'marketing', label: 'Marketing', value: 'marketing', count: 28 },
                    { key: 'sales', label: 'Sales', value: 'sales', count: 67 },
                ],
            },
            {
                key: 'status',
                label: 'Status',
                type: 'string',
                options: [
                    { key: 'active', label: 'Active', value: 'active', count: 235 },
                    { key: 'on_leave', label: 'On Leave', value: 'on_leave', count: 28 },
                    { key: 'contractor', label: 'Contractor', value: 'contractor', count: 57 },
                ],
            },
            {
                key: 'salary',
                label: 'Salary',
                type: 'number',
                buckets: 15,
                numericRange: {
                    min: 40_000,
                    max: 200_000,
                    values: salaryValues,
                },
            },
            {
                key: 'hired',
                label: 'Hire Date',
                type: 'custom',
            },
        ], []);

        const { filterValues, rangeValues, customValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange, handleCustomValueChange } =
            useFilterState(filters);

        const activeFilterCount =
            Object.values(filterValues).reduce((sum, s) => sum + s.size, 0) +
            Object.values(rangeValues).filter(Boolean).length +
            Object.values(customValues).filter((v) => v !== undefined && v !== null).length;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                        Mixed Filter Types
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Single-select, multi-select, numeric range and custom editor in
                        one panel, plus a search box.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        ref={buttonRef}
                        style={activeFilterCount > 0 ? activeButtonStyle : buttonStyle}
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                    </button>
                    {activeFilterCount > 0 && (
                        <span style={{ fontSize: '0.85rem' }}>
                            {activeFilterCount} active filter
                            {activeFilterCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <FilterPanel
                    isOpen={isOpen}
                    filters={filters}
                    filterValues={filterValues}
                    rangeValues={rangeValues}
                    customValues={customValues}
                    search={search}
                    searchPlaceholder="Search filters…"
                    expandedFilterKey={expandedFilterKey}
                    anchorRef={buttonRef}
                    onClose={() => setIsOpen(false)}
                    onSearchChange={setSearch}
                    onFilterToggle={handleToggleFilter}
                    onFilterClear={handleClearFilter}
                    onRangeChange={handleRangeChange}
                    onExpandedFilterChange={setExpandedFilterKey}
                    onCustomValueChange={handleCustomValueChange}
                >
                    <FilterEditor filterKey="hired">
                        {({ value, onChange }) => (
                            <DateRangeEditor value={value} onChange={onChange} />
                        )}
                    </FilterEditor>
                </FilterPanel>
            </div>
        );
    },
};

// ---------------------------------------------------------------------------
// Story: Option list search grows out of overflow, not a flag
// ---------------------------------------------------------------------------

const repositories = Array.from({ length: 30 }, (_, index) => ({
    key: `repo-${index}`,
    label: `repository-${String(index + 1).padStart(2, '0')}`,
    value: `repo-${index}`,
}));

export const AutoSearchWhenOverflowing: Story = {
    name: 'Search appears only when the list overflows',
    play: async ({ canvasElement }) => {
        const { body } = await openFilterGroup(canvasElement, 'Repository', 'Repository');

        // 30 repositories do not fit in the option list's box, so a search box appears on
        // its own - no `searchable` flag was set on this filter definition.
        const search = await body.findByPlaceholderText('Search…');
        await expect(search).toBeTruthy();

        await userEvent.type(search, 'repository-05');
        const match = await body.findByRole('checkbox', { name: /^repository-05/ });
        await userEvent.click(match);
        await expect(match).toBeChecked();

        // Every other repository is filtered out of view while the search text narrows the list.
        await expect(body.queryByText('repository-01')).toBeNull();
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = useMemo(() => [
            {
                key: 'repository',
                label: 'Repository',
                type: 'string',
                multi: true,
                options: repositories,
            },
        ], []);

        const { filterValues, rangeValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange } =
            useFilterState(filters);

        const activeCount = filterValues['repository']?.size ?? 0;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                        Search Appears Only When Needed
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        30 options overflow the option list&apos;s box, so a search box grows
                        out of the list automatically and stays pinned to the top while the
                        rows beneath it scroll. No <code>searchable</code> flag is set on this
                        filter — compare with &quot;Search never appears for a short list&quot;.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        ref={buttonRef}
                        style={isOpen ? activeButtonStyle : buttonStyle}
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        Repository{activeCount > 0 ? ` (${activeCount})` : ''}
                    </button>
                </div>
                <FilterPanel
                    isOpen={isOpen}
                    filters={filters}
                    filterValues={filterValues}
                    rangeValues={rangeValues}
                    expandedFilterKey={expandedFilterKey}
                    anchorRef={buttonRef}
                    onClose={() => setIsOpen(false)}
                    onFilterToggle={handleToggleFilter}
                    onFilterClear={handleClearFilter}
                    onRangeChange={handleRangeChange}
                    onExpandedFilterChange={setExpandedFilterKey}
                />
            </div>
        );
    },
};

// ---------------------------------------------------------------------------
// Story: Option list search never appears for a short list
// ---------------------------------------------------------------------------

export const NoSearchWhenItFits: Story = {
    name: 'Search never appears for a short list',
    play: async ({ canvasElement }) => {
        const { body, canvas } = await openFilterGroup(canvasElement, 'Priority', 'Priority');

        // Three options fit comfortably in the option list's box, so no search box is
        // rendered at all - not hidden, not empty, simply not there.
        await expect(body.queryByPlaceholderText('Search…')).toBeNull();

        const high = await body.findByRole('radio', { name: /^High/ });
        await userEvent.click(high);
        await expect(high).toBeChecked();
        await expect(canvas.getByRole('button', { name: 'Priority (1)' })).toBeTruthy();
    },
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = useMemo(() => [
            {
                key: 'priority',
                label: 'Priority',
                type: 'string',
                options: [
                    { key: 'high', label: 'High', value: 'high', count: 4 },
                    { key: 'medium', label: 'Medium', value: 'medium', count: 11 },
                    { key: 'low', label: 'Low', value: 'low', count: 22 },
                ],
            },
        ], []);

        const { filterValues, rangeValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange } =
            useFilterState(filters);

        const activeCount = filterValues['priority']?.size ?? 0;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                        No Search For A Short List
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        Three options fit without scrolling, so no search box is rendered -
                        compare with &quot;Search appears only when the list overflows&quot;.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        ref={buttonRef}
                        style={isOpen ? activeButtonStyle : buttonStyle}
                        onClick={() => setIsOpen((v) => !v)}
                    >
                        Priority{activeCount > 0 ? ` (${activeCount})` : ''}
                    </button>
                </div>
                <FilterPanel
                    isOpen={isOpen}
                    filters={filters}
                    filterValues={filterValues}
                    rangeValues={rangeValues}
                    expandedFilterKey={expandedFilterKey}
                    anchorRef={buttonRef}
                    onClose={() => setIsOpen(false)}
                    onFilterToggle={handleToggleFilter}
                    onFilterClear={handleClearFilter}
                    onRangeChange={handleRangeChange}
                    onExpandedFilterChange={setExpandedFilterKey}
                />
            </div>
        );
    },
};

/** Exercise real browser fixed containing blocks; no Dialog renderer slot is involved. */
export const TransformedOverlayContainer: Story = {
    name: 'Filter position in offset transformed overlay containers',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);
        const centeredAnchor = canvas.getByRole('button', { name: 'Centered filter trigger' });
        await userEvent.click(centeredAnchor);
        const centeredPanel = await body.findByRole('dialog', { name: 'Transformed filter choices' });
        await expect(centeredPanel.parentElement?.id).toBe('transformed-filter-overlays');
        await expect(getComputedStyle(centeredPanel.parentElement!).transform).not.toBe('none');
        await waitFor(() => expect(getComputedStyle(centeredPanel).opacity).toBe('1'), { timeout: 5000 });
        await waitFor(() => {
            const anchor = centeredAnchor.getBoundingClientRect();
            const panel = centeredPanel.getBoundingClientRect();
            expect(Math.abs(panel.left - anchor.left)).toBeLessThan(4);
            expect(Math.abs(panel.top - anchor.bottom - 8)).toBeLessThan(4);
            expect(panel.left).toBeGreaterThanOrEqual(16);
            expect(panel.right).toBeLessThanOrEqual(window.innerWidth - 16 + 1);
        }, { timeout: 5000 });
        centeredAnchor.style.left = '260px';
        window.dispatchEvent(new Event('resize'));
        await waitFor(() => expect(Math.abs(centeredPanel.getBoundingClientRect().left - centeredAnchor.getBoundingClientRect().left)).toBeLessThan(4));
        centeredAnchor.style.top = '200px';
        window.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(Math.abs(centeredPanel.getBoundingClientRect().top - centeredAnchor.getBoundingClientRect().bottom - 8)).toBeLessThan(4));
        // Re-read the containing-block origin after its position changes during a scroll.
        centeredPanel.parentElement!.style.top = '120px';
        window.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(Math.abs(centeredPanel.getBoundingClientRect().top - centeredAnchor.getBoundingClientRect().bottom - 8)).toBeLessThan(4));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Transformed filter choices' })).toBeNull(), { timeout: 5000 });

        const edgeAnchor = canvas.getByRole('button', { name: 'Edge filter trigger' });
        await userEvent.click(edgeAnchor);
        const edgePanel = await body.findByRole('dialog', { name: 'Ancestor filter choices' });
        await expect(edgePanel.parentElement?.id).toBe('ancestor-filter-overlays');
        await expect(getComputedStyle(edgePanel.parentElement!).transform).toBe('none');
        await expect(getComputedStyle(edgePanel.parentElement!.parentElement!).transform).not.toBe('none');
        await waitFor(() => expect(getComputedStyle(edgePanel).opacity).toBe('1'), { timeout: 5000 });
        await waitFor(() => {
            const anchor = edgeAnchor.getBoundingClientRect();
            const panel = edgePanel.getBoundingClientRect();
            // This scaled host leaves only 240 CSS pixels of effective viewport width.
            const scale = new DOMMatrixReadOnly(getComputedStyle(edgePanel.parentElement!.parentElement!).transform).a;
            expect(window.innerWidth / scale).toBeLessThanOrEqual(241);
            expect(Math.abs(panel.right - (window.innerWidth - 16))).toBeLessThan(1);
            expect(Math.abs(panel.bottom - (anchor.top - 8))).toBeLessThan(4);
            expect(panel.left).toBeGreaterThanOrEqual(15);
            expect(panel.top).toBeGreaterThanOrEqual(15);
            expect(panel.right).toBeLessThanOrEqual(window.innerWidth - 16);
            expect(panel.bottom).toBeLessThanOrEqual(window.innerHeight - 15);
        }, { timeout: 5000 });
        const probe = Array.from(edgePanel.parentElement!.children).find((child) =>
            child instanceof HTMLElement && child.style.visibility === 'hidden') as HTMLElement;
        await expect(probe).toBeTruthy();
        const measure = probe.getBoundingClientRect.bind(probe);
        let measurements = 0;
        probe.getBoundingClientRect = () => { measurements++; return measure(); };
        const optionList = edgePanel.querySelector<HTMLElement>('.pv-option-list')!;
        optionList.scrollTop = 60;
        optionList.dispatchEvent(new Event('scroll'));
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        await expect(measurements).toBe(0);
    },
    render: () => {
        const centeredRef = useRef<HTMLButtonElement>(null);
        const edgeRef = useRef<HTMLButtonElement>(null);
        const [open, setOpen] = useState<'center' | 'edge' | null>(null);
        const common = {
            filters: [{ key: 'status', label: 'Status', multi: true,
                options: Array.from({ length: 30 }, (_, index) => ({ key: `${index}`, label: `Option ${index}`, value: `${index}` })) }],
            filterValues: {}, rangeValues: {},
            onFilterToggle: () => undefined, onFilterClear: () => undefined,
            onRangeChange: () => undefined, onExpandedFilterChange: () => undefined,
        };
        return <CratisComponentsProvider overlayEnvironment={{
            getContainer: () => document.getElementById(open === 'edge' ? 'ancestor-filter-overlays' : 'transformed-filter-overlays'),
        }}>
            <button ref={centeredRef} onClick={() => setOpen('center')}
                style={{ position: 'fixed', top: 180, left: 240 }}>Centered filter trigger</button>
            <button ref={edgeRef} onClick={() => setOpen('edge')}
                style={{ position: 'fixed', bottom: 36, right: 24 }}>Edge filter trigger</button>
            <div id='transformed-filter-overlays'
                style={{ position: 'fixed', top: 100, left: 80, transform: 'translateZ(0)' }} />
            <div style={{ position: 'fixed', top: 90, left: 60, transform: `translateZ(0) scale(${window.innerWidth / 240})` }}>
                <div style={{ position: 'relative', top: 10, left: 20 }} id='ancestor-filter-overlays' />
            </div>
            <FilterPanel {...common} isOpen={open === 'center'} anchorRef={centeredRef}
                aria-label='Transformed filter choices' onClose={() => setOpen(null)} />
            <FilterPanel {...common} isOpen={open === 'edge'} anchorRef={edgeRef}
                expandedFilterKey='status' aria-label='Ancestor filter choices' onClose={() => setOpen(null)} />
        </CratisComponentsProvider>;
    },
};
