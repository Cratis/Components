// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useEffect,
    useState,
    type ButtonHTMLAttributes,
    type CSSProperties,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
    type SyntheticEvent,
} from 'react';
import { Button as AriaButton } from 'react-aria-components/Button';
import { Dialog as AriaDialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { Button, type ButtonParts } from '../Common/Button';
import { DatePickerInput } from '../Common/DatePickerInput';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { asReactAriaButtonProps } from '../Common/reactAriaProps';
import { Dropdown, type DropdownParts } from '../Dropdown/Dropdown';
import type { ChangeHandler } from '../types/ChangeHandler';
import {
    DataTableFilterMatchMode,
    type DataTableFilterConstraint,
    type DataTableFilterMatchMode as FilterMatchMode,
} from './DataTableFilterMeta';

/** Value editor used by a built-in column filter. */
export type ColumnFilterDataType = 'text' | 'numeric' | 'date' | 'boolean';

/** Localizable labels owned by the column filter popup. */
export interface ColumnFilterMenuLabels {
    /** Builds the filter-trigger accessible name from the effective field. */
    filterTriggerAriaLabel: (field: string) => string;
    /** Builds the value-control accessible name from the effective field. */
    valueAriaLabel: (field: string) => string;
    /** Accessible name for the match-mode selector. */
    matchModeAriaLabel: string;
    /** Localizes a match mode while retaining its default label as fallback input. */
    matchModeLabel: (mode: FilterMatchMode, defaultLabel: string) => string;
    /** Clear action label. */
    clear: string;
    /** Apply action label. */
    apply: string;
    /** Boolean true option label. */
    true: string;
    /** Boolean false option label. */
    false: string;
}

interface ColumnFilterOverlayAttributes {
    id?: string;
    className?: string;
    style?: CSSProperties;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
    [attribute: `data-${string}`]: string | number | boolean | undefined;
}

/** Stable Cratis-owned parts for a column filter popup. */
export interface ColumnFilterMenuParts {
    /** Header-cell filter trigger. */
    trigger?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'>;
    /** Portaled filter popover. */
    popover?: ColumnFilterOverlayAttributes;
    /** Semantic filter dialog/menu. */
    menu?: ColumnFilterOverlayAttributes;
    /** Match-mode Dropdown parts. */
    matchMode?: DropdownParts;
    /** Built-in value input, or root class/style for date/boolean controls. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Clear/apply action row. */
    actions?: HTMLAttributes<HTMLDivElement>;
    /** Clear Button parts. */
    clear?: ButtonParts;
    /** Apply Button parts. */
    apply?: ButtonParts;
}

/** Default English labels for the column filter popup. */
export const defaultColumnFilterMenuLabels: ColumnFilterMenuLabels = {
    filterTriggerAriaLabel: (field) => `Filter by ${field}`,
    valueAriaLabel: (field) => `Filter value for ${field}`,
    matchModeAriaLabel: 'Match mode',
    matchModeLabel: (_mode, defaultLabel) => defaultLabel,
    clear: 'Clear',
    apply: 'Apply',
    true: 'True',
    false: 'False',
};

/** State and actions supplied to a custom column filter value editor. */
export interface ColumnFilterElementOptions {
    /** Effective filtered field. */
    field: string;
    /** Current draft value. */
    value: unknown;
    /** Current draft match mode. */
    matchMode: FilterMatchMode;
    /** Updates the draft value. */
    onChange: ChangeHandler<unknown>;
    /** Updates the draft match mode independently of the value. */
    onMatchModeChange: ChangeHandler<FilterMatchMode>;
    /** Applies the draft filter. */
    onApply: (event: SyntheticEvent) => void;
    /** Clears the field filter. */
    onClear: (event: SyntheticEvent) => void;
}

/** Custom renderer for a column filter's value editor. */
export type ColumnFilterElement = (options: ColumnFilterElementOptions) => ReactNode;

/** Props for the Cratis-owned draft/apply column filter popup. */
export interface ColumnFilterMenuProps {
    /** Effective row field being filtered. */
    field: string;
    /** Built-in value editor and match-mode family. */
    dataType?: ColumnFilterDataType;
    /** Placeholder for the value editor. */
    placeholder?: string;
    /** Whether the match-mode selector is shown. */
    showMatchModes?: boolean;
    /** Custom value editor replacing the built-in control. */
    filterElement?: ColumnFilterElement;
    /** Partial localization overrides. */
    labels?: Partial<ColumnFilterMenuLabels>;
    /** Stable part attributes. */
    pt?: ColumnFilterMenuParts;
    /** Currently applied constraint. */
    constraint?: DataTableFilterConstraint;
    /** Applies one draft constraint. */
    onApply: (constraint: DataTableFilterConstraint) => void;
    /** Removes the field constraint. */
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

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

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
    pt,
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

    const { messages } = useCratisComponentsConfig();
    const columnFilterMessages = messages?.columnFilter;
    const resolvedLabels: ColumnFilterMenuLabels = {
        filterTriggerAriaLabel:
            labels?.filterTriggerAriaLabel ??
            columnFilterMessages?.filterTriggerAriaLabel ??
            defaultColumnFilterMenuLabels.filterTriggerAriaLabel,
        valueAriaLabel:
            labels?.valueAriaLabel ??
            columnFilterMessages?.valueAriaLabel ??
            defaultColumnFilterMenuLabels.valueAriaLabel,
        matchModeAriaLabel:
            labels?.matchModeAriaLabel ??
            columnFilterMessages?.matchModeAriaLabel ??
            defaultColumnFilterMenuLabels.matchModeAriaLabel,
        matchModeLabel:
            labels?.matchModeLabel ??
            columnFilterMessages?.matchModeLabel ??
            defaultColumnFilterMenuLabels.matchModeLabel,
        clear: labels?.clear ?? columnFilterMessages?.clear ?? defaultColumnFilterMenuLabels.clear,
        apply: labels?.apply ?? columnFilterMessages?.apply ?? defaultColumnFilterMenuLabels.apply,
        true: labels?.true ?? columnFilterMessages?.true ?? defaultColumnFilterMenuLabels.true,
        false: labels?.false ?? columnFilterMessages?.false ?? defaultColumnFilterMenuLabels.false,
    };
    const modeOptions = optionsFor(dataType).map((option) => ({
        ...option,
        label: resolvedLabels.matchModeLabel(option.value, option.label),
    }));
    if (!modeOptions.some((option) => option.value === draftMode)) {
        modeOptions.push({
            label: resolvedLabels.matchModeLabel(draftMode, String(draftMode)),
            value: draftMode,
        });
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
              onChange: setDraftValue,
              onMatchModeChange: setDraftMode,
              onApply: apply,
              onClear: clear,
          })
        : (() => {
              switch (dataType) {
                  case 'numeric':
                      return (
                          <input
                              {...pt?.input}
                              type='number'
                              aria-label={resolvedLabels.valueAriaLabel(field)}
                              value={typeof draftValue === 'number' ? draftValue : ''}
                              placeholder={placeholder}
                              className={classNames(
                                  'cratis-filter-menu__input',
                                  pt?.input?.className,
                              )}
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
                              aria-label={resolvedLabels.valueAriaLabel(field)}
                              className={pt?.input?.className}
                              style={pt?.input?.style}
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
                              onChange={setDraftValue}
                              aria-label={resolvedLabels.valueAriaLabel(field)}
                              className={pt?.input?.className}
                              style={pt?.input?.style}
                          />
                      );
                  default:
                      return (
                          <input
                              {...pt?.input}
                              value={typeof draftValue === 'string' ? draftValue : ''}
                              aria-label={resolvedLabels.valueAriaLabel(field)}
                              placeholder={placeholder}
                              className={classNames(
                                  'cratis-filter-menu__input',
                                  pt?.input?.className,
                              )}
                              onChange={(event) => setDraftValue(event.target.value)}
                          />
                      );
              }
          })();

    return (
        <DialogTrigger>
            <AriaButton
                {...asReactAriaButtonProps(pt?.trigger)}
                aria-label={resolvedLabels.filterTriggerAriaLabel(field)}
                className={classNames(
                    'cratis-filter-trigger',
                    pt?.trigger?.className,
                )}
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
            <Popover
                {...pt?.popover}
                className={classNames(
                    'cratis-filter-popover',
                    pt?.popover?.className,
                )}
                data-cratis-part='filter-popover'
                placement='bottom end'
            >
                <AriaDialog
                    {...pt?.menu}
                    className={classNames('cratis-filter-menu', pt?.menu?.className)}
                    data-cratis-part='filter-menu'
                    aria-label={resolvedLabels.filterTriggerAriaLabel(field)}
                >
                    {showMatchModes && (
                        <Dropdown
                            value={draftMode}
                            options={modeOptions}
                            optionLabel='label'
                            optionValue='value'
                            onChange={setDraftMode}
                            aria-label={resolvedLabels.matchModeAriaLabel}
                            pt={pt?.matchMode}
                        />
                    )}
                    {valueInput}
                    <div
                        {...pt?.actions}
                        className={classNames(
                            'cratis-filter-menu-actions',
                            pt?.actions?.className,
                        )}
                        data-cratis-part='filter-actions'
                    >
                        <Button
                            variant='outline'
                            onClick={clear}
                            label={resolvedLabels.clear}
                            pt={pt?.clear}
                        />
                        <Button
                            onClick={apply}
                            label={resolvedLabels.apply}
                            pt={pt?.apply}
                        />
                    </div>
                </AriaDialog>
            </Popover>
        </DialogTrigger>
    );
};
