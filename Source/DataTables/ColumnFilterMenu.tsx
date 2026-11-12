// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useCallback,
    useEffect,
    useRef,
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
import { classNames } from '../ClassNames/classNames';

/** Value editor used by a built-in column filter. */
export type ColumnFilterDataType = 'text' | 'numeric' | 'date' | 'boolean';

/** One selectable value offered by a column filter that filters over a known set. */
export interface ColumnFilterOption {
    /** The text shown for this value in the filter menu. */
    label: string;
    /** The value written into the filter constraint when this option is picked. */
    value: unknown;
}

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
    /** Updates the draft value and may describe how the custom editor produced it. */
    onChange: ChangeHandler<unknown>;
    /** Updates the draft match mode independently of the value. */
    onMatchModeChange: (matchMode: FilterMatchMode) => void;
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
    /** The values this column can be filtered by, offered as a list instead of a free-form input. */
    filterOptions?: ColumnFilterOption[];
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

/** Cratis-owned column filter popup with draft/apply behavior. */
export const ColumnFilterMenu = ({
    field,
    dataType = 'text',
    placeholder,
    showMatchModes = true,
    filterElement,
    filterOptions,
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
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setDraftValue(constraint?.value ?? null);
        setDraftMode(constraint?.matchMode ?? defaultModeFor(dataType));
    }, [constraint, dataType]);

    const capturePopover = useRestoreFocusOnClose(isOpen, triggerRef);

    const { messages } = useCratisComponentsConfig();
    const resolvedLabels = resolveColumnFilterLabels(
        labels,
        messages?.columnFilter,
        defaultColumnFilterMenuLabels,
    );
    const modeOptions = buildModeOptions(
        dataType,
        Boolean(filterOptions),
        draftMode,
        resolvedLabels.matchModeLabel,
    );

    const hasConstraint =
        constraint?.value !== null &&
        constraint?.value !== undefined &&
        constraint?.value !== '';

    const clear = (event?: SyntheticEvent) => {
        setDraftValue(null);
        onClear();
        event?.preventDefault();
    };
    const apply = (event?: SyntheticEvent) => {
        onApply({ value: draftValue, matchMode: draftMode });
        event?.preventDefault();
    };

    const valueInput = (
        <ColumnFilterValueInput
            field={field}
            dataType={dataType}
            placeholder={placeholder}
            filterOptions={filterOptions}
            filterElement={filterElement}
            draftValue={draftValue}
            draftMode={draftMode}
            setDraftValue={setDraftValue}
            setDraftMode={setDraftMode}
            apply={apply}
            clear={clear}
            labels={resolvedLabels}
            pt={pt}
        />
    );

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
            <AriaButton
                {...asReactAriaButtonProps(pt?.trigger)}
                ref={triggerRef}
                aria-label={resolvedLabels.filterTriggerAriaLabel(field)}
                className={classNames(
                    'cratis-filter-trigger',
                    pt?.trigger?.className,
                )}
                data-active={hasConstraint || undefined}
                data-selected={hasConstraint || undefined}
                data-open={isOpen || undefined}
                data-cratis-part='filter-trigger'
                data-cratis-component='ColumnFilterMenu'
            >
                <svg
                    className='cratis-filter-trigger__icon'
                    viewBox='0 0 16 16'
                    fill='currentColor'
                    aria-hidden='true'
                    focusable='false'
                >
                    <path d='M1.5 2.5A.5.5 0 0 1 2 2h12a.5.5 0 0 1 .38.82L10 8.1v4.52a.5.5 0 0 1-.24.43l-3 1.8A.5.5 0 0 1 6 14.42V8.1L1.62 2.82a.5.5 0 0 1-.12-.32Z' />
                </svg>
            </AriaButton>
            <Popover
                {...pt?.popover}
                ref={capturePopover}
                className={classNames(
                    'cratis-filter-popover',
                    pt?.popover?.className,
                )}
                data-cratis-part='filter-popover'
                data-open={isOpen || undefined}
                placement='bottom end'
            >
                <AriaDialog
                    {...pt?.menu}
                    className={classNames('cratis-filter-menu', pt?.menu?.className)}
                    data-cratis-part='filter-menu'
                    data-open={isOpen || undefined}
                    aria-label={resolvedLabels.filterTriggerAriaLabel(field)}
                >
                    {showMatchModes && (
                        <Dropdown
                            value={draftMode}
                            options={modeOptions}
                            optionLabel='label'
                            optionValue='value'
                            onChange={(value) => setDraftMode(value)}
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
