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

/** Stable Cratis-owned parts for styling a {@link Radio}. */
export interface RadioParts {
    /** Wrapping native label. */
    root?: LabelHTMLAttributes<HTMLLabelElement>;
    /** Native radio input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual radio box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual selected indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
    /** Visible label content. */
    label?: HTMLAttributes<HTMLSpanElement>;
}

const radioPartsMatchManifest: ExactPartKeys<RadioParts, PartsOf<'Radio'>> = true;
void radioPartsMatchManifest;

/** Props for one native {@link Radio} option. */
export interface RadioProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | 'children'
    | 'className'
    | 'name'
    | 'onChange'
    | 'readOnly'
    | 'style'
    | 'type'
    | 'value'
> {
    /** Native form group name shared with related radio options. */
    name: string;
    /** Native form value submitted when this option is checked. */
    value: string | number;
    /** Visible option label. Supply `aria-label` when no visible label is rendered. */
    label?: ReactNode;
    /** Prevents user changes without removing the checked value from form submission. */
    readOnly?: boolean;
    /** Marks the option invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives `true` when the native option becomes checked and includes user metadata. */
    onChange?: ChangeHandler<boolean>;
    /** Class name applied to the wrapping label. */
    className?: string;
    /** Inline style applied to the wrapping label. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: RadioParts;
}

/** One native radio option; grouping and selection ownership remain with the browser and host. */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
    {
        name,
        value,
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
        true,
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
                type='radio'
                name={name}
                value={value}
                checked={effectiveChecked}
                defaultChecked={effectiveDefaultChecked}
                disabled={effectiveDisabled}
                readOnly={undefined}
                aria-invalid={effectiveAriaInvalid}
                onClick={(event) => {
                    pt?.input?.onClick?.(event);
                    onClick?.(event);
                    if (effectiveReadOnly) event.preventDefault();
                }}
                onChange={(event) => {
                    pt?.input?.onChange?.(event);
                    if (effectiveReadOnly || !event.currentTarget.checked) return;
                    synchronize(true);
                    onChange?.(true, {
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
                {...pt?.box}
                className={['cratis-radio__box', pt?.box?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='box'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={effectiveInvalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
                data-selected={selected || undefined}
                aria-hidden='true'
            >
                <span
                    {...pt?.indicator}
                    className={['cratis-radio__indicator', pt?.indicator?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='indicator'
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
