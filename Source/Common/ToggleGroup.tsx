// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type HTMLAttributes, type Key, type ReactNode } from 'react';
import {
    ToggleButton as AriaToggleButton,
    ToggleButtonGroup as AriaToggleButtonGroup,
} from 'react-aria-components/ToggleButtonGroup';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Attributes a consumer may hand to one {@link ToggleGroup} part: class, style, title and data attributes. */
export type ToggleGroupPartAttributes = Pick<
    HTMLAttributes<HTMLElement>,
    'className' | 'style' | 'title'
> & {
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

/** One choice in a {@link ToggleGroup}. */
export interface ToggleGroupOption {
    /** Value this option selects. */
    value: string;
    /** Visible label. */
    label: ReactNode;
    /** Content rendered before the label — an icon, a swatch. Decorative. */
    icon?: ReactNode;
    /** Whether this option cannot be chosen. */
    disabled?: boolean;
}

/** Stable Cratis-owned parts for styling a {@link ToggleGroup}. */
export interface ToggleGroupParts {
    /** The group element. */
    root?: ToggleGroupPartAttributes;
    /** One selectable option. */
    option?: ToggleGroupPartAttributes;
    /** An option's leading icon wrapper, rendered only for an option that has one. */
    icon?: ToggleGroupPartAttributes;
    /** An option's label. */
    label?: ToggleGroupPartAttributes;
}

const toggleGroupPartsMatchManifest: ExactPartKeys<
    ToggleGroupParts,
    PartsOf<'ToggleGroup'>
> = true;
void toggleGroupPartsMatchManifest;

/** Props for {@link ToggleGroup}. */
export interface ToggleGroupProps {
    /** The choices, in display order. Two to four is the shape this control is for. */
    options: ToggleGroupOption[];
    /** Currently selected value. */
    value: string;
    /** Called with the newly selected value. A click on the selected option is ignored. */
    onChange: (value: string) => void;
    /** Whether every option is disabled. */
    disabled?: boolean;
    /**
     * Id of the element naming this control. A group has no single labelable element, so an external
     * `<label>` associates by id rather than `htmlFor`.
     */
    'aria-labelledby'?: string;
    /** Accessible name, when no visible label names the control. */
    'aria-label'?: string;
    /** Id of the element describing the control — typically a field's error or hint text. */
    'aria-describedby'?: string;
    /** Marks the control invalid for assistive technology. */
    invalid?: boolean;
    /** Extra class name for the group element. */
    className?: string;
    /** Cratis-owned per-part attributes. */
    pt?: ToggleGroupParts;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/**
 * A single-selection group of exclusive choices — a segmented control.
 *
 * This is a *value* choice, not a panel switcher: it carries `radiogroup`/`radio` semantics from
 * React Aria's `ToggleButtonGroup`, not `tablist`/`tab`, and the arrow keys those semantics promise
 * move the selection. Reach for `Tabs` when the choice reveals a panel of content instead.
 *
 * The group is a single tab stop, as a radio group is: `Tab` moves into and out of it, and the arrow
 * keys move within it. The selected option carries the stop, or the first enabled option when the
 * value matches none.
 */
export const ToggleGroup = ({
    options,
    value,
    onChange,
    disabled = false,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    invalid = false,
    className,
    pt,
}: ToggleGroupProps) => {
    // A radio group is one tab stop: Tab reaches the group, the arrows move inside it. React Aria's
    // ToggleButtonGroup keeps every button tabbable, which is toolbar behaviour and would make a
    // four-option group cost four stops, so the stop is placed here instead.
    const enabled = options.filter((option) => !option.disabled);
    const tabStop = enabled.some((option) => option.value === value)
        ? value
        : enabled[0]?.value;

    return (
        <AriaToggleButtonGroup
            {...pt?.root}
            selectionMode='single'
            disallowEmptySelection
            selectedKeys={[value]}
            isDisabled={disabled}
            onSelectionChange={(keys: Set<Key>) => {
                // React Aria reports the whole selection; single selection with an empty set disallowed
                // means exactly one key, and re-selecting the current one reports it unchanged.
                const [selected] = [...keys];
                if (selected !== undefined && selected !== value)
                    onChange(String(selected));
            }}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
            className={classNames('cratis-toggle-group', pt?.root?.className, className)}
            data-cratis-part='root'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
        >
            {options.map((option) => (
                <AriaToggleButton
                    key={option.value}
                    {...pt?.option}
                    id={option.value}
                    isDisabled={disabled || option.disabled}
                    excludeFromTabOrder={option.value !== tabStop}
                    className={classNames(
                        'cratis-toggle-group__option',
                        pt?.option?.className,
                    )}
                    data-cratis-part='option'
                    data-selected={option.value === value || undefined}
                    data-disabled={disabled || option.disabled || undefined}
                    data-invalid={invalid || undefined}
                >
                    {option.icon !== undefined && (
                        <span
                            {...pt?.icon}
                            aria-hidden='true'
                            className={classNames(
                                'cratis-toggle-group__icon',
                                pt?.icon?.className,
                            )}
                            data-cratis-part='icon'
                        >
                            {option.icon}
                        </span>
                    )}
                    <span
                        {...pt?.label}
                        className={classNames(
                            'cratis-toggle-group__label',
                            pt?.label?.className,
                        )}
                        data-cratis-part='label'
                    >
                        {option.label}
                    </span>
                </AriaToggleButton>
            ))}
        </AriaToggleButtonGroup>
    );
};
