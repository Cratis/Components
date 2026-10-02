// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { Button, type ButtonProps } from 'react-aria-components/Button';
import { FaChevronDown, FaTriangleExclamation } from 'react-icons/fa6';
import { classNames } from '../ClassNames/classNames';
import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerParts } from './IconPickerParts';

/** Props for {@link IconPickerTrigger}. */
export interface IconPickerTriggerProps {
    /** The selected icon, when the catalog holds it. */
    entry: IconPickerEntry | undefined;

    /** What names the selection when the catalog does not hold it, or the placeholder when nothing is selected. */
    fallbackName: string;

    /** The name of the selected icon's library, shown when several libraries are offered. */
    providerName?: string;

    /** Whether the selection is absent from a complete catalog. */
    missing: boolean;

    /** Whether the popout is open. */
    open: boolean;

    /** Whether the control is disabled. */
    disabled: boolean;

    /** Whether the control shows its value without letting it change. */
    readOnly: boolean;

    /** Whether the control is marked invalid. */
    invalid: boolean;

    /** The element id of the trigger. */
    id?: string;

    /** The element id of the name, which the trigger's accessible name includes. */
    nameId: string;

    /** The accessible name of the trigger, without the selection. */
    label: string;

    /** The id of an element naming the trigger, supplied by the host. */
    labelledBy?: string;

    /** The ids of the elements describing the trigger. */
    describedBy?: string;

    /** Pass-through attributes. */
    parts?: IconPickerParts;
}

/**
 * The closed control: the selected glyph and its name, which opens the popout. A selection the catalog
 * does not hold shows its raw qualified identity with a warning mark rather than another icon.
 */
export const IconPickerTrigger = ({
    entry,
    fallbackName,
    providerName,
    missing,
    open,
    disabled,
    readOnly,
    invalid,
    id,
    nameId,
    label,
    labelledBy,
    describedBy,
    parts,
}: IconPickerTriggerProps) => {
        const name = entry?.name ?? fallbackName;
        const glyph: ReactNode = entry ? (
            entry.renderPreview()
        ) : missing ? (
            <FaTriangleExclamation focusable='false' />
        ) : null;

        return (
            <Button
                // SAFETY: spread only onto a React Aria Button, which renders an HTMLButtonElement - the same
                // element the part is typed against; only its declared event-callback parameter types are wider.
                {...(parts?.trigger as unknown as ButtonProps | undefined)}
                id={id}
                isDisabled={disabled}
                aria-disabled={readOnly || undefined}
                aria-label={labelledBy ? undefined : `${label}: ${name}`}
                aria-labelledby={labelledBy ? `${labelledBy} ${nameId}` : undefined}
                aria-describedby={describedBy}
                className={classNames('cratis-icon-picker__trigger', parts?.trigger?.className)}
                data-cratis-part='trigger'
                data-disabled={disabled || undefined}
                data-invalid={invalid || undefined}
                data-readonly={readOnly || undefined}
                data-open={open || undefined}
                data-missing={missing || undefined}
            >
                <span
                    {...parts?.glyph}
                    aria-hidden='true'
                    className={classNames('cratis-icon-picker__glyph', parts?.glyph?.className)}
                    data-cratis-part='glyph'
                >
                    {glyph}
                </span>
                <span
                    {...parts?.name}
                    id={nameId}
                    className={classNames('cratis-icon-picker__name', parts?.name?.className)}
                    data-cratis-part='name'
                >
                    {name}
                </span>
                {providerName !== undefined && (
                    <span
                        {...parts?.provider}
                        className={classNames('cratis-icon-picker__provider', parts?.provider?.className)}
                        data-cratis-part='provider'
                    >
                        {providerName}
                    </span>
                )}
                <FaChevronDown className='cratis-icon-picker__chevron' aria-hidden='true' focusable='false' />
            </Button>
    );
};
