// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import {
    withCommandFormFieldBinding,
    useCommandFormContext,
    type BaseCommandFormFieldProps,
    type InjectedCommandFormFieldProps,
} from '@cratis/arc.react/commands';
import { Guid } from '@cratis/fundamentals';
import { useFieldAccessibility, type FieldAccessibilityProps } from './fieldAccessibility';

/** Stable part attributes for {@link GuidField}. */
export interface GuidParts {
    /** Native text input. Value and change handling remain owned by the field. */
    root?: InputHTMLAttributes<HTMLInputElement>;
}

/** A native Guid binding with an independently editable text draft. */
export interface GuidFieldProps<TCommand = unknown>
    extends BaseCommandFormFieldProps<TCommand>, InjectedCommandFormFieldProps, FieldAccessibilityProps {
    /** Selects a scalar Guid property on the command. */
    value(instance: TCommand): Guid | undefined | null;
    /** Hint displayed when the draft is empty. */
    placeholder?: string;
    /** Additional classes on the native input. */
    className?: string;
    /** Native input pass-through attributes. */
    pt?: GuidParts;
    /** Message for a nonempty draft that Fundamentals does not recognize as a Guid. */
    formatErrorMessage?: string;
    /** Message for an empty required field. */
    requiredErrorMessage?: string;
    /** Change to discard the draft even when the command value is already empty. */
    resetKey?: unknown;
}

function GuidFieldComponent<TCommand = unknown>(props: GuidFieldProps<TCommand>) {
    const { currentValue, fieldName, resetKey } = props;
    const { getFieldError, customFieldErrors, setCustomFieldError } = useCommandFormContext<TCommand>();
    const required = props.required ?? !props.propertyDescriptor?.isOptional;
    const textForValue = (value: unknown) => value instanceof Guid ? value.toString() : '';
    const [draft, setDraft] = useState(() => ({ value: currentValue, resetKey, text: textForValue(currentValue) }));
    // Synchronize external population during render, not in a delayed effect that can overwrite typing.
    if (!Object.is(draft.value, currentValue) || !Object.is(draft.resetKey, resetKey)) {
        setDraft({ value: currentValue, resetKey, text: textForValue(currentValue) });
    }
    const text = Object.is(draft.value, currentValue) && Object.is(draft.resetKey, resetKey) ? draft.text : textForValue(currentValue);
    const errorForText = (value: string) => value.length === 0
        ? (required ? props.requiredErrorMessage || 'A value is required.' : undefined)
        : (Guid.isGuid(value) ? undefined : props.formatErrorMessage || 'Enter a valid Guid.');
    const error = errorForText(text);
    const ownedErrorRef = useRef<string | undefined>(undefined);
    const latestGetFieldErrorRef = useRef(getFieldError);
    latestGetFieldErrorRef.current = getFieldError;

    // Arc's getter reads custom errors live, including writes in an event that unmounts this field
    // before it renders again. A render-time map (even an optimistic copy) cannot establish ownership.
    // Only clear an error this field owns; a caller's onFieldValidate error must survive valid edits.
    const publishError = (nextError: string | undefined) => {
        if (!fieldName) return;
        if (nextError || (ownedErrorRef.current && getFieldError(fieldName) === ownedErrorRef.current)) {
            setCustomFieldError(fieldName, nextError);
        }
        ownedErrorRef.current = nextError;
    };
    useEffect(() => {
        if (error !== ownedErrorRef.current || (error && fieldName && customFieldErrors[fieldName] !== error)) {
            publishError(error);
        }
    });
    useEffect(() => () => {
        if (fieldName && ownedErrorRef.current && latestGetFieldErrorRef.current(fieldName) === ownedErrorRef.current) {
            setCustomFieldError(fieldName, undefined);
        }
    }, [fieldName, setCustomFieldError]);

    const fieldError = fieldName ? getFieldError(fieldName) : undefined;
    const errors = [...new Set([error, fieldError].filter((message): message is string => Boolean(message)))];
    const invalid = errors.length > 0;
    const accessibility = useFieldAccessibility({ ...props, errors }, {
        id: props.pt?.root?.id,
        ariaLabel: props.pt?.root?.['aria-label'],
        ariaDescribedBy: props.pt?.root?.['aria-describedby'],
    });
    return <>
        <input
            {...props.pt?.root}
            id={accessibility.controlId}
            aria-label={accessibility.ariaLabel}
            aria-describedby={accessibility.ariaDescribedBy}
            aria-required={required || undefined}
            aria-invalid={invalid || undefined}
            type='text'
            value={text}
            onChange={(event) => {
                const nextText = event.currentTarget.value;
                const nextValue = Guid.isGuid(nextText) ? Guid.parse(nextText) : undefined;
                setDraft({ value: nextValue, resetKey, text: nextText });
                // Clear the old identifier immediately, including for partial/invalid input. Arc still
                // owns command mutation, validation and execution; this field only supplies its error.
                publishError(undefined);
                props.onValueChange?.(nextValue);
                // Publish unconditionally after binding: native callbacks may have replaced the
                // previous error synchronously, before context has rendered its new error map.
                publishError(errorForText(nextText));
            }}
            onBlur={props.onBlur}
            placeholder={props.placeholder}
            data-disabled={props.pt?.root?.disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={props.pt?.root?.readOnly || undefined}
            data-cratis-part='input'
            className={['cratis-field-input', 'cratis:w-full', props.pt?.root?.className, props.className].filter(Boolean).join(' ')}
        />
        {accessibility.hiddenError}
    </>;
}

/** Edits a scalar Fundamentals Guid without generating an identifier or imposing version/nonzero rules. */
export const GuidField = withCommandFormFieldBinding(GuidFieldComponent);
