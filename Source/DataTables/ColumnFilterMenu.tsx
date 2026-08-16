// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type SyntheticEvent } from 'react';
import { DataTable } from 'primereact/datatable';
import { Popover } from 'primereact/popover';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import type { InputNumberRootValueChangeEvent } from '@primereact/types/primitive/inputnumber';
import type { DataTableFilterExposes } from '@primereact/types/primitive/datatable';
import { Button } from 'primereact/button';
import { Dropdown } from '../Dropdown/Dropdown';
import { DatePickerInput } from '../Common/DatePickerInput';

/** The value kind a {@link ColumnFilterMenu} edits, which drives the match modes and the input control. */
export type ColumnFilterDataType = 'text' | 'numeric' | 'date' | 'boolean';

/** Props for {@link ColumnFilterMenu}. */
export interface ColumnFilterMenuProps {
    /** The row field this menu filters. */
    field: string;
    /** The value kind — selects the match modes and the input control. Defaults to `'text'`. */
    dataType?: ColumnFilterDataType;
    /** Placeholder for the value input. */
    placeholder?: string;
    /** Whether to show the match-mode selector. Defaults to `true`. */
    showMatchModes?: boolean;
}

const BOOLEAN_OPTIONS = [
    { label: 'True', value: true },
    { label: 'False', value: false },
];

/**
 * The filter affordance for a single data-table column: a filter icon in the
 * header that opens a popover menu with a match-mode selector, a value input
 * (text / number / date / boolean), and Clear / Apply actions. Restores the
 * PrimeReact 10 `filterDisplay="menu"` experience on PrimeReact 11's headless
 * `DataTable.Filter` state machine — which manages the filter draft and the
 * actual client-side row filtering, but renders none of the chrome — portaled
 * through `primereact/popover`.
 *
 * Rendered by {@link DataTableCore} inside a `THeadCell` for any `<Column>`
 * with `filter` set. Must live inside a `DataTable.Root` subtree.
 */
export const ColumnFilterMenu = ({ field, dataType = 'text', placeholder, showMatchModes = true }: ColumnFilterMenuProps) => (
    <DataTable.Filter field={field} display="menu" dataType={dataType} showOperator={false} showAddButton={false}>
        {(filter: DataTableFilterExposes) => {
            const commit = (value: unknown, event?: SyntheticEvent) =>
                filter.onChange(event ?? ({} as SyntheticEvent), value, filter.matchMode);

            const valueInput = (() => {
                switch (dataType) {
                    case 'numeric':
                        return (
                            <InputNumber.Root
                                value={(filter.value as number | null) ?? null}
                                onValueChange={(e: InputNumberRootValueChangeEvent) => commit(e.value)}>
                                <InputNumber.Input placeholder={placeholder} className="w-full" />
                            </InputNumber.Root>
                        );
                    case 'date':
                        return (
                            <DatePickerInput
                                value={filter.value ? new Date(filter.value as string | number | Date) : null}
                                onChange={(date) => commit(date)}
                                showIcon
                            />
                        );
                    case 'boolean':
                        return (
                            <Dropdown
                                value={filter.value}
                                options={BOOLEAN_OPTIONS}
                                optionLabel="label"
                                optionValue="value"
                                placeholder={placeholder}
                                showClear
                                onChange={(e) => commit(e.value)}
                            />
                        );
                    default:
                        return (
                            <InputText
                                value={(filter.value as string) ?? ''}
                                placeholder={placeholder}
                                className="w-full"
                                onChange={(e) => commit(e.target.value, e)}
                            />
                        );
                }
            })();

            return (
                <Popover.Root
                    open={filter.overlayVisible}
                    onOpenChange={(event) => (event.value ? filter.onShowOverlay() : filter.onHideOverlay())}>
                    <Popover.Trigger
                        aria-label={`Filter by ${field}`}
                        className={filter.isActive ? 'cratis-filter-trigger cratis-filter-trigger--active' : 'cratis-filter-trigger'}>
                        <i className="pi pi-filter" />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Positioner>
                            <Popover.Popup>
                                <Popover.Content>
                                    <div className="cratis-filter-menu">
                                        {showMatchModes && (
                                            <Dropdown
                                                value={filter.matchMode}
                                                options={filter.matchModeOptions}
                                                optionLabel="label"
                                                optionValue="value"
                                                onChange={(e) => filter.onChange(
                                                    (e.originalEvent as SyntheticEvent) ?? ({} as SyntheticEvent),
                                                    filter.value,
                                                    e.value as string)}
                                            />
                                        )}
                                        {valueInput}
                                        <div className="cratis-filter-menu-actions">
                                            <Button variant="outlined" onClick={(e) => filter.onClear(e)}>
                                                <span>Clear</span>
                                            </Button>
                                            <Button onClick={(e) => filter.onApply(e)}>
                                                <span>Apply</span>
                                            </Button>
                                        </div>
                                    </div>
                                </Popover.Content>
                            </Popover.Popup>
                        </Popover.Positioner>
                    </Popover.Portal>
                </Popover.Root>
            );
        }}
    </DataTable.Filter>
);
