// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import type { RadioProps } from './Radio';
import { useNativeCheckedState } from './useNativeCheckedState';

/** Core implementation for the native radio presentation slot. */
export const RadioImplementation = forwardRef<HTMLInputElement, RadioProps>(
    function RadioImplementation(
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
            invalid ||
            effectiveAriaInvalid === true ||
            effectiveAriaInvalid === 'true';
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
                        className={[
                            'cratis-radio__indicator',
                            pt?.indicator?.className,
                        ]
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
    },
);
