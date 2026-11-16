// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes, type ReactNode, type SyntheticEvent } from 'react';
import { Dialog as AriaDialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';
import { type ButtonParts } from '../Common/Button';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { Dropdown, type DropdownParts } from '../Dropdown/Dropdown';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { DataTableFilterConstraint, DataTableFilterMatchMode as FilterMatchMode } from './DataTableFilterMeta';
import { classNames } from '../ClassNames/classNames';
import { ColumnFilterActions } from './ColumnFilterActions';
import { ColumnFilterTrigger } from './ColumnFilterTrigger';
import { ColumnFilterValueInput } from './ColumnFilterValueInput';
import { buildModeOptions } from './columnFilterMatchModes';
import { resolveColumnFilterLabels } from './resolveColumnFilterLabels';
import { useColumnFilterDraft } from './useColumnFilterDraft';
import { useRestoreFocusOnClose } from './useRestoreFocusOnClose';

const hasAppliedValue = (constraint?: DataTableFilterConstraint): boolean =>
    constraint?.value !== null && constraint?.value !== undefined && constraint?.value !== '';

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
    const { draftValue, draftMode, setDraftValue, setDraftMode, apply, clear } = useColumnFilterDraft(
        dataType,
        constraint,
        onApply,
        onClear,
    );
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
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
    const label = resolvedLabels.filterTriggerAriaLabel(field);

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
            <ColumnFilterTrigger
                label={label}
                hasConstraint={hasAppliedValue(constraint)}
                isOpen={isOpen}
                triggerRef={triggerRef}
                pt={pt}
            />
            <Popover
                {...pt?.popover}
                ref={capturePopover}
                className={classNames('cratis-filter-popover', pt?.popover?.className)}
                data-cratis-part='filter-popover'
                data-open={isOpen || undefined}
                placement='bottom end'
            >
                <AriaDialog
                    {...pt?.menu}
                    className={classNames('cratis-filter-menu', pt?.menu?.className)}
                    data-cratis-part='filter-menu'
                    data-open={isOpen || undefined}
                    aria-label={label}
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
                    <ColumnFilterActions labels={resolvedLabels} apply={apply} clear={clear} pt={pt} />
                </AriaDialog>
            </Popover>
        </DialogTrigger>
    );
};
