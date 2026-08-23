// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode, SyntheticEvent } from 'react';
import { DataTable } from 'primereact/datatable';
import { Popover } from 'primereact/popover';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import type { InputNumberRootValueChangeEvent } from '@primereact/types/primitive/inputnumber';
import type { DataTableFilterExposes } from '@primereact/types/primitive/datatable';
import { Button } from 'primereact/button';
import { Dropdown } from '../Dropdown/Dropdown';
import { DatePickerInput } from '../Common/DatePickerInput';
import type { DataTableFilterMatchMode } from './DataTableFilterMeta';

/** The value kind a {@link ColumnFilterMenu} edits, which drives the match modes and the input control. */
export type ColumnFilterDataType = 'text' | 'numeric' | 'date' | 'boolean';

/** Localizable chrome rendered by {@link ColumnFilterMenu}. */
export interface ColumnFilterMenuLabels {
    /** Builds the accessible name for a column's filter trigger. */
    filterTriggerAriaLabel: (field: string) => string;
    /** Clear action label. */
    clear: string;
    /** Apply action label. */
    apply: string;
    /** Boolean true option label. */
    true: string;
    /** Boolean false option label. */
    false: string;
}

/** Default English labels for {@link ColumnFilterMenu}. */
export const defaultColumnFilterMenuLabels: ColumnFilterMenuLabels = {
    filterTriggerAriaLabel: (field) => `Filter by ${field}`,
    clear: 'Clear',
    apply: 'Apply',
    true: 'True',
    false: 'False',
};

/** State and actions supplied to a custom column filter editor. */
export interface ColumnFilterElementOptions {
    /** The row field being filtered. */
    field: string;
    /** Current draft value. */
    value: unknown;
    /** Current draft match mode. */
    matchMode: DataTableFilterMatchMode;
    /** Updates the draft without applying it. */
    onChange: (value: unknown, matchMode?: DataTableFilterMatchMode) => void;
    /** Applies the current draft. */
    onApply: (event: SyntheticEvent) => void;
    /** Clears the current field filter. */
    onClear: (event: SyntheticEvent) => void;
}

/** Renders a custom value editor inside a column filter menu. */
export type ColumnFilterElement = (options: ColumnFilterElementOptions) => ReactNode;

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
    /** Custom value editor rendered instead of the built-in editor. */
    filterElement?: ColumnFilterElement;
    /** Overrides the default English menu labels. */
    labels?: Partial<ColumnFilterMenuLabels>;
}

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
const eventForFilter = (event?: SyntheticEvent): SyntheticEvent => {
    if (event) return event;

    // SAFETY: PrimeReact's draft change handler does not inspect the event for programmatic editors.
    return {} as SyntheticEvent;
};

export const ColumnFilterMenu = ({
    field,
    dataType = 'text',
    placeholder,
    showMatchModes = true,
    filterElement,
    labels,
}: ColumnFilterMenuProps) => (
    <DataTable.Filter
        field={field}
        display='menu'
        dataType={dataType}
        showOperator={false}
        showAddButton={false}
    >
        {(filter: DataTableFilterExposes) => {
            const resolvedLabels: ColumnFilterMenuLabels = {
                filterTriggerAriaLabel:
                    labels?.filterTriggerAriaLabel ??
                    defaultColumnFilterMenuLabels.filterTriggerAriaLabel,
                clear: labels?.clear ?? defaultColumnFilterMenuLabels.clear,
                apply: labels?.apply ?? defaultColumnFilterMenuLabels.apply,
                true: labels?.true ?? defaultColumnFilterMenuLabels.true,
                false: labels?.false ?? defaultColumnFilterMenuLabels.false,
            };
            const booleanOptions = [
                { label: resolvedLabels.true, value: true },
                { label: resolvedLabels.false, value: false },
            ];
            const commit = (
                value: unknown,
                event?: SyntheticEvent,
                matchMode = filter.matchMode,
            ) => filter.onChange(eventForFilter(event), value, matchMode);

            const builtInValueInput = (() => {
                switch (dataType) {
                    case 'numeric':
                        return (
                            <InputNumber.Root
                                value={(filter.value as number | null) ?? null}
                                onValueChange={(e: InputNumberRootValueChangeEvent) =>
                                    commit(e.value)
                                }
                            >
                                <InputNumber.Input
                                    placeholder={placeholder}
                                    className='w-full'
                                />
                            </InputNumber.Root>
                        );
                    case 'date':
                        return (
                            <DatePickerInput
                                value={
                                    filter.value
                                        ? new Date(filter.value as string | number | Date)
                                        : null
                                }
                                onChange={(date) => commit(date)}
                                showIcon
                            />
                        );
                    case 'boolean':
                        return (
                            <Dropdown
                                value={filter.value}
                                options={booleanOptions}
                                optionLabel='label'
                                optionValue='value'
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
                                className='w-full'
                                onChange={(e) => commit(e.target.value, e)}
                            />
                        );
                }
            })();
            const valueInput = filterElement
                ? filterElement({
                      field,
                      value: filter.value,
                      // SAFETY: PrimeReact stores the Cratis vocabulary's runtime string values unchanged.
                      matchMode: filter.matchMode as DataTableFilterMatchMode,
                      onChange: (value, matchMode) => commit(value, undefined, matchMode),
                      onApply: filter.onApply,
                      onClear: filter.onClear,
                  })
                : builtInValueInput;

            return (
                <Popover.Root
                    open={filter.overlayVisible}
                    onOpenChange={(event) =>
                        event.value ? filter.onShowOverlay() : filter.onHideOverlay()
                    }
                >
                    <Popover.Trigger
                        aria-label={resolvedLabels.filterTriggerAriaLabel(field)}
                        className={
                            filter.isActive
                                ? 'cratis-filter-trigger cratis-filter-trigger--active'
                                : 'cratis-filter-trigger'
                        }
                    >
                        <i className='pi pi-filter' />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Positioner>
                            <Popover.Popup>
                                <Popover.Content>
                                    <div className='cratis-filter-menu'>
                                        {showMatchModes && (
                                            <Dropdown
                                                value={filter.matchMode}
                                                options={filter.matchModeOptions}
                                                optionLabel='label'
                                                optionValue='value'
                                                onChange={(e) =>
                                                    filter.onChange(
                                                        eventForFilter(e.originalEvent),
                                                        filter.value,
                                                        e.value as string,
                                                    )
                                                }
                                            />
                                        )}
                                        {valueInput}
                                        <div className='cratis-filter-menu-actions'>
                                            <Button
                                                variant='outlined'
                                                onClick={(e) => filter.onClear(e)}
                                            >
                                                <span>{resolvedLabels.clear}</span>
                                            </Button>
                                            <Button onClick={(e) => filter.onApply(e)}>
                                                <span>{resolvedLabels.apply}</span>
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
