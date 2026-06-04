// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterPanel } from './FilterPanel';
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
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = [
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
        ];

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
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Single-select Filter</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>
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
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                            Selected: {Array.from(filterValues['status'] ?? []).join(', ')}
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
// Story: Multi-select string filter
// ---------------------------------------------------------------------------

export const MultiSelectFilter: Story = {
    name: 'Multi-select string filter',
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = [
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
        ];

        const { filterValues, rangeValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange } =
            useFilterState(filters);

        const activeCount = filterValues['department']?.size ?? 0;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Multi-select Filter</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>
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
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                            Selected: {Array.from(filterValues['department'] ?? []).join(', ')}
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
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = [
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
        ];

        const { filterValues, rangeValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange } =
            useFilterState(filters);

        const range = rangeValues['age'];

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Numeric Range Filter</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>
                        Histogram with draggable range handles. Click a bar to jump-select that bucket.
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
                        type="button"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', opacity: 0.7 }}>
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
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', opacity: 0.7 }}>
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
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);

        const filters: FilterDefinition[] = [
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
        ];

        const { filterValues, rangeValues, customValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange, handleCustomValueChange } =
            useFilterState(filters);

        const rating = customValues['rating'];
        const dateRange = customValues['createdAt'] as { from?: string; to?: string } | undefined;
        const hasFilters = (typeof rating === 'number' && rating > 0) || dateRange?.from || dateRange?.to;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Custom Filter Editors</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>
                        Declare a <code style={{ fontFamily: 'monospace', fontSize: '0.8em', opacity: 0.8 }}>&lt;FilterEditor&gt;</code> child inside <code style={{ fontFamily: 'monospace', fontSize: '0.8em', opacity: 0.8 }}>&lt;FilterPanel&gt;</code> to provide a custom editor for any filter group.
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
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                            {typeof rating === 'number' && rating > 0 && `Rating ≥ ${rating} ★`}
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
    render: () => {
        const buttonRef = useRef<HTMLButtonElement>(null!);
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState('');

        const filters: FilterDefinition[] = [
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
        ];

        const { filterValues, rangeValues, customValues, expandedFilterKey, setExpandedFilterKey, handleToggleFilter, handleClearFilter, handleRangeChange, handleCustomValueChange } =
            useFilterState(filters);

        const activeFilterCount =
            Object.values(filterValues).reduce((sum, s) => sum + s.size, 0) +
            Object.values(rangeValues).filter(Boolean).length +
            Object.values(customValues).filter((v) => v !== undefined && v !== null).length;

        return (
            <div style={pageStyle}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Mixed Filter Types</h2>
                    <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>
                        Single-select, multi-select, numeric range and custom editor in one panel, plus a search box.
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
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                            {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
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
