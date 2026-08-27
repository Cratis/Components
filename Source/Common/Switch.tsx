// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    forwardRef,
    type CSSProperties,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type LabelHTMLAttributes,
    type ReactNode,
} from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { useNativeCheckedState } from './useNativeCheckedState';

/** Stable Cratis-owned parts for styling a {@link Switch}. */
export interface SwitchParts {
    /** Wrapping native label. */
    root?: LabelHTMLAttributes<HTMLLabelElement>;
    /** Native checkbox input with switch semantics. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual switch track. */
    control?: HTMLAttributes<HTMLSpanElement>;
    /** Visual switch handle. */
    handle?: HTMLAttributes<HTMLSpanElement>;
    /** Visible label content. */
    label?: HTMLAttributes<HTMLSpanElement>;
}

const switchPartsMatchManifest: ExactPartKeys<SwitchParts, PartsOf<'Switch'>> = true;
void switchPartsMatchManifest;

/** Props for {@link Switch}. */
export interface SwitchProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'children' | 'className' | 'onChange' | 'readOnly' | 'style' | 'type'
> {
    /** Visible label content. Supply `aria-label` when no visible label is rendered. */
    label?: ReactNode;
    /** Prevents user changes without removing the checked value from form submission. */
    readOnly?: boolean;
    /** Marks the switch invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next checked value and native user-event metadata. */
    onChange?: ChangeHandler<boolean>;
    /** Class name applied to the wrapping label. */
    className?: string;
    /** Inline style applied to the wrapping label. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: SwitchParts;
}

/** A native checkbox with switch semantics, semantic changes, and stable visual parts. */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
    {
        label,
        readOnly,
        invalid = false,
        onChange,
        className,
        style,
        pt,
        checked,
        defaultChecked,
        disabled,
        onClick,
        'aria-invalid': ariaInvalid,
        ...nativeProps
    },
    forwardedRef,
) {
    const effectiveChecked = checked ?? pt?.input?.checked;
    const effectiveDefaultChecked = defaultChecked ?? pt?.input?.defaultChecked;
    const effectiveDisabled = disabled ?? pt?.input?.disabled;
    const effectiveReadOnly = readOnly ?? pt?.input?.readOnly;
    const effectiveAriaInvalid =
        ariaInvalid ?? pt?.input?.['aria-invalid'] ?? (invalid || undefined);
    const effectiveInvalid =
        invalid || effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';
    const { ref, selected, synchronize } = useNativeCheckedState(
        effectiveChecked,
        effectiveDefaultChecked,
        forwardedRef,
    );
    return (
        <label
            {...pt?.root}
            className={['cratis-choice', pt?.root?.className, className]
                .filter(Boolean)
                .join(' ')}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
            data-disabled={effectiveDisabled || undefined}
            data-invalid={effectiveInvalid || undefined}
            data-readonly={effectiveReadOnly || undefined}
            data-selected={selected || undefined}
        >
            <input
                {...pt?.input}
                {...nativeProps}
                ref={ref}
                type='checkbox'
                role='switch'
                checked={effectiveChecked}
                defaultChecked={effectiveDefaultChecked}
                disabled={effectiveDisabled}
                readOnly={undefined}
                aria-invalid={effectiveAriaInvalid}
                aria-readonly={effectiveReadOnly || undefined}
                onClick={(event) => {
                    pt?.input?.onClick?.(event);
                    onClick?.(event);
                    if (effectiveReadOnly) event.preventDefault();
                }}
                onChange={(event) => {
                    pt?.input?.onChange?.(event);
                    if (effectiveReadOnly) return;
                    synchronize(event.currentTarget.checked);
                    onChange?.(event.currentTarget.checked, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={['cratis-choice__input', pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='input'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={effectiveInvalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
                data-selected={selected || undefined}
            />
            <span
                {...pt?.control}
                className={['cratis-switch__control', pt?.control?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='control'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={effectiveInvalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
                data-selected={selected || undefined}
                aria-hidden='true'
            >
                <span
                    {...pt?.handle}
                    className={['cratis-switch__handle', pt?.handle?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='handle'
                    data-disabled={effectiveDisabled || undefined}
                    data-invalid={effectiveInvalid || undefined}
                    data-readonly={effectiveReadOnly || undefined}
                    data-selected={selected || undefined}
                />
            </span>
            {label !== undefined && (
                <span
                    {...pt?.label}
                    className={['cratis-choice__label', pt?.label?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='label'
                    data-disabled={effectiveDisabled || undefined}
                    data-invalid={effectiveInvalid || undefined}
                    data-readonly={effectiveReadOnly || undefined}
                    data-selected={selected || undefined}
                >
                    {label}
                </span>
            )}
        </label>
    );
});
