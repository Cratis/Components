// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SyntheticEvent } from 'react';
import { DatePickerInput } from '../Common/DatePickerInput';
import { Dropdown } from '../Dropdown/Dropdown';
import { classNames } from '../ClassNames/classNames';
import type { DataTableFilterMatchMode as FilterMatchMode } from './DataTableFilterMeta';
import type {
    ColumnFilterDataType,
    ColumnFilterElement,
    ColumnFilterMenuLabels,
    ColumnFilterMenuParts,
    ColumnFilterOption,
} from './ColumnFilterMenu';

export interface ColumnFilterValueInputProps {
    field: string;
    dataType: ColumnFilterDataType;
    placeholder?: string;
    filterOptions?: ColumnFilterOption[];
    filterElement?: ColumnFilterElement;
    draftValue: unknown;
    draftMode: FilterMatchMode;
    setDraftValue: (update: unknown | (() => unknown)) => void;
    setDraftMode: (mode: FilterMatchMode) => void;
    apply: (event?: SyntheticEvent) => void;
    clear: (event?: SyntheticEvent) => void;
    labels: ColumnFilterMenuLabels;
    pt?: ColumnFilterMenuParts;
}

type BuiltInInputProps = Pick<
    ColumnFilterValueInputProps,
    'field' | 'placeholder' | 'draftValue' | 'setDraftValue' | 'labels' | 'pt'
>;

const NumericInput = ({ field, placeholder, draftValue, setDraftValue, labels, pt }: BuiltInInputProps) => (
    <input
        {...pt?.input}
        type='number'
        aria-label={labels.valueAriaLabel(field)}
        value={typeof draftValue === 'number' ? draftValue : ''}
        placeholder={placeholder}
        className={classNames('cratis-filter-menu__input', pt?.input?.className)}
        onChange={(event) =>
            setDraftValue(event.target.value === '' ? null : event.target.valueAsNumber)
        }
    />
);

const DateInput = ({ field, draftValue, setDraftValue, labels, pt }: BuiltInInputProps) => (
    <DatePickerInput
        value={draftValue instanceof Date ? draftValue : null}
        onChange={(value) => setDraftValue(value)}
        showIcon
        aria-label={labels.valueAriaLabel(field)}
        className={pt?.input?.className}
        style={pt?.input?.style}
    />
);

const BooleanInput = ({ field, placeholder, draftValue, setDraftValue, labels, pt }: BuiltInInputProps) => (
    <Dropdown
        value={draftValue}
        options={[
            { label: labels.true, value: true },
            { label: labels.false, value: false },
        ]}
        placeholder={placeholder}
        showClear
        onChange={(value) => setDraftValue(value)}
        aria-label={labels.valueAriaLabel(field)}
        className={pt?.input?.className}
        style={pt?.input?.style}
    />
);

const TextInput = ({ field, placeholder, draftValue, setDraftValue, labels, pt }: BuiltInInputProps) => (
    <input
        {...pt?.input}
        value={typeof draftValue === 'string' ? draftValue : ''}
        aria-label={labels.valueAriaLabel(field)}
        placeholder={placeholder}
        className={classNames('cratis-filter-menu__input', pt?.input?.className)}
        onChange={(event) => setDraftValue(event.target.value)}
    />
);

const builtInInputs: Record<ColumnFilterDataType, (props: BuiltInInputProps) => React.JSX.Element> = {
    numeric: NumericInput,
    date: DateInput,
    boolean: BooleanInput,
    text: TextInput,
};

/**
 * Renders the value editor of a column filter. The built-in editors are called as functions, not
 * mounted as components, so switching data type keeps the same element type at the same position.
 */
export const ColumnFilterValueInput = (props: ColumnFilterValueInputProps) => {
    const { field, dataType, placeholder, filterOptions, filterElement, draftValue, draftMode, setDraftValue, setDraftMode, apply, clear, labels, pt } = props;
    if (filterOptions) {
        return (
            <Dropdown
                value={draftValue}
                options={filterOptions}
                optionLabel='label'
                optionValue='value'
                placeholder={placeholder}
                showClear
                onChange={(value) => setDraftValue(() => value)}
                aria-label={labels.valueAriaLabel(field)}
                className={pt?.input?.className}
                style={pt?.input?.style}
            />
        );
    }
    if (filterElement) {
        return filterElement({
            field,
            value: draftValue,
            matchMode: draftMode,
            onChange: (value) => setDraftValue(() => value),
            onMatchModeChange: (matchMode) => setDraftMode(matchMode),
            onApply: apply,
            onClear: clear,
        });
    }
    return (builtInInputs[dataType] ?? TextInput)({ field, placeholder, draftValue, setDraftValue, labels, pt });
};
