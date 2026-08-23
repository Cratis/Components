// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';
import { Button as AriaButton } from 'react-aria-components/Button';
import { Dialog as AriaDialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { Button } from '../Common/Button';
import { DatePickerInput } from '../Common/DatePickerInput';
import { Dropdown } from '../Dropdown/Dropdown';
import {
    DataTableFilterMatchMode,
    type DataTableFilterConstraint,
    type DataTableFilterMatchMode as FilterMatchMode,
} from './DataTableFilterMeta';

export type ColumnFilterDataType = 'text' | 'numeric' | 'date' | 'boolean';

export interface ColumnFilterMenuLabels {
    filterTriggerAriaLabel: (field: string) => string;
    clear: string;
    apply: string;
    true: string;
    false: string;
}

export const defaultColumnFilterMenuLabels: ColumnFilterMenuLabels = {
    filterTriggerAriaLabel: (field) => `Filter by ${field}`,
    clear: 'Clear',
    apply: 'Apply',
    true: 'True',
    false: 'False',
};

export interface ColumnFilterElementOptions {
    field: string;
    value: unknown;
    matchMode: FilterMatchMode;
    onChange: (value: unknown, matchMode?: FilterMatchMode) => void;
    onApply: (event: SyntheticEvent) => void;
    onClear: (event: SyntheticEvent) => void;
}

export type ColumnFilterElement = (options: ColumnFilterElementOptions) => ReactNode;

export interface ColumnFilterMenuProps {
    field: string;
    dataType?: ColumnFilterDataType;
    placeholder?: string;
    showMatchModes?: boolean;
    filterElement?: ColumnFilterElement;
    labels?: Partial<ColumnFilterMenuLabels>;
    constraint?: DataTableFilterConstraint;
    onApply: (constraint: DataTableFilterConstraint) => void;
    onClear: () => void;
}

interface MatchModeOption {
    label: string;
    value: FilterMatchMode;
}

const optionsFor = (dataType: ColumnFilterDataType): MatchModeOption[] => {
    switch (dataType) {
        case 'numeric':
            return [
                ['Equals', DataTableFilterMatchMode.Equals],
                ['Not equals', DataTableFilterMatchMode.NotEquals],
                ['Less than', DataTableFilterMatchMode.LessThan],
                ['Less than or equal', DataTableFilterMatchMode.LessThanOrEqual],
                ['Greater than', DataTableFilterMatchMode.GreaterThan],
                ['Greater than or equal', DataTableFilterMatchMode.GreaterThanOrEqual],
            ].map(([label, value]) => ({ label, value }) as MatchModeOption);
        case 'date':
            return [
                ['Date is', DataTableFilterMatchMode.DateIs],
                ['Date is not', DataTableFilterMatchMode.DateIsNot],
                ['Before', DataTableFilterMatchMode.DateBefore],
                ['After', DataTableFilterMatchMode.DateAfter],
            ].map(([label, value]) => ({ label, value }) as MatchModeOption);
        case 'boolean':
            return [{ label: 'Equals', value: DataTableFilterMatchMode.Equals }];
        default:
            return [
                ['Contains', DataTableFilterMatchMode.Contains],
                ['Starts with', DataTableFilterMatchMode.StartsWith],
                ['Ends with', DataTableFilterMatchMode.EndsWith],
                ['Equals', DataTableFilterMatchMode.Equals],
                ['Not contains', DataTableFilterMatchMode.NotContains],
                ['Not equals', DataTableFilterMatchMode.NotEquals],
            ].map(([label, value]) => ({ label, value }) as MatchModeOption);
    }
};

const defaultModeFor = (dataType: ColumnFilterDataType): FilterMatchMode => {
    if (dataType === 'text') return DataTableFilterMatchMode.Contains;
    if (dataType === 'date') return DataTableFilterMatchMode.DateIs;
    return DataTableFilterMatchMode.Equals;
};

/** Cratis-owned column filter popup with draft/apply behavior. */
export const ColumnFilterMenu = ({
    field,
    dataType = 'text',
    placeholder,
    showMatchModes = true,
    filterElement,
    labels,
    constraint,
    onApply,
    onClear,
}: ColumnFilterMenuProps) => {
    const [draftValue, setDraftValue] = useState<unknown>(constraint?.value ?? null);
    const [draftMode, setDraftMode] = useState<FilterMatchMode>(
        constraint?.matchMode ?? defaultModeFor(dataType),
    );

    useEffect(() => {
        setDraftValue(constraint?.value ?? null);
        setDraftMode(constraint?.matchMode ?? defaultModeFor(dataType));
    }, [constraint, dataType]);

    const resolvedLabels: ColumnFilterMenuLabels = {
        filterTriggerAriaLabel:
            labels?.filterTriggerAriaLabel ??
            defaultColumnFilterMenuLabels.filterTriggerAriaLabel,
        clear: labels?.clear ?? defaultColumnFilterMenuLabels.clear,
        apply: labels?.apply ?? defaultColumnFilterMenuLabels.apply,
        true: labels?.true ?? defaultColumnFilterMenuLabels.true,
        false: labels?.false ?? defaultColumnFilterMenuLabels.false,
    };
    const modeOptions = optionsFor(dataType);
    if (!modeOptions.some((option) => option.value === draftMode)) {
        modeOptions.push({ label: String(draftMode), value: draftMode });
    }

    const clear = (event?: SyntheticEvent) => {
        setDraftValue(null);
        onClear();
        event?.preventDefault();
    };
    const apply = (event?: SyntheticEvent) => {
        onApply({ value: draftValue, matchMode: draftMode });
        event?.preventDefault();
    };

    const valueInput = filterElement
        ? filterElement({
              field,
              value: draftValue,
              matchMode: draftMode,
              onChange: (value, matchMode) => {
                  setDraftValue(value);
                  if (matchMode) setDraftMode(matchMode);
              },
              onApply: apply,
              onClear: clear,
          })
        : (() => {
              switch (dataType) {
                  case 'numeric':
                      return (
                          <input
                              type='number'
                              value={typeof draftValue === 'number' ? draftValue : ''}
                              placeholder={placeholder}
                              className='cratis-filter-menu__input'
                              onChange={(event) =>
                                  setDraftValue(
                                      event.target.value === ''
                                          ? null
                                          : event.target.valueAsNumber,
                                  )
                              }
                          />
                      );
                  case 'date':
                      return (
                          <DatePickerInput
                              value={draftValue instanceof Date ? draftValue : null}
                              onChange={setDraftValue}
                              showIcon
                              aria-label={
                                  placeholder ??
                                  resolvedLabels.filterTriggerAriaLabel(field)
                              }
                          />
                      );
                  case 'boolean':
                      return (
                          <Dropdown
                              value={draftValue}
                              options={[
                                  { label: resolvedLabels.true, value: true },
                                  { label: resolvedLabels.false, value: false },
                              ]}
                              placeholder={placeholder}
                              showClear
                              onChange={(event) => setDraftValue(event.value)}
                              aria-label={
                                  placeholder ??
                                  resolvedLabels.filterTriggerAriaLabel(field)
                              }
                          />
                      );
                  default:
                      return (
                          <input
                              value={typeof draftValue === 'string' ? draftValue : ''}
                              placeholder={placeholder}
                              className='cratis-filter-menu__input'
                              onChange={(event) => setDraftValue(event.target.value)}
                          />
                      );
              }
          })();

    return (
        <DialogTrigger>
            <AriaButton
                aria-label={resolvedLabels.filterTriggerAriaLabel(field)}
                className='cratis-filter-trigger'
                data-active={
                    (constraint?.value !== null &&
                        constraint?.value !== undefined &&
                        constraint?.value !== '') ||
                    undefined
                }
                data-cratis-part='filter-trigger'
            >
                <span aria-hidden='true'>⌕</span>
            </AriaButton>
            <Popover className='cratis-filter-popover' placement='bottom end'>
                <AriaDialog
                    className='cratis-filter-menu'
                    aria-label={resolvedLabels.filterTriggerAriaLabel(field)}
                >
                    {showMatchModes && (
                        <Dropdown
                            value={draftMode}
                            options={modeOptions}
                            optionLabel='label'
                            optionValue='value'
                            onChange={(event) =>
                                setDraftMode(event.value as FilterMatchMode)
                            }
                            aria-label='Match mode'
                        />
                    )}
                    {valueInput}
                    <div className='cratis-filter-menu-actions'>
                        <Button outlined onClick={clear} label={resolvedLabels.clear} />
                        <Button onClick={apply} label={resolvedLabels.apply} />
                    </div>
                </AriaDialog>
            </Popover>
        </DialogTrigger>
    );
};
