// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactElement } from 'react';
// Only symbols @cratis/arc.react 20.3.1 already exports may be imported at module scope here: the
// package declares Arc React as a range, and a missing named import fails when the module links.
import {
    asCommandFormField,
    useCommandFormContext,
    type BaseCommandFormFieldProps,
    type InjectedCommandFormFieldProps,
    type WrappedFieldProps,
} from '@cratis/arc.react/commands';
import { Guid } from '@cratis/fundamentals';
import { markAsCommandFormField } from '../commandFormMarkers';
import { useFieldAccessibility, type FieldAccessibilityProps } from './fieldAccessibility';

const defaultGuidFormatErrorMessage = 'Enter a valid Guid.';

const defaultGuidRequiredErrorMessage = 'A value is required.';

/** Stable part attributes for {@link GuidField}. */
export interface GuidParts {
    /** Native text input. Its value, change handling and validation attributes remain owned by the field. */
    root?: InputHTMLAttributes<HTMLInputElement>;
}

/** Props for {@link GuidField}. */
export interface GuidFieldProps<TCommand = unknown>
    extends BaseCommandFormFieldProps<TCommand>,
        InjectedCommandFormFieldProps,
        FieldAccessibilityProps {
    /** Selects a scalar Fundamentals `Guid` property on the command. */
    value(instance: TCommand): Guid | undefined | null;
    /** Hint displayed while the text is empty. */
    placeholder?: string;
    /** Additional classes on the native input. */
    className?: string;
    /** Native input attributes. */
    pt?: GuidParts;
    /** Localizable error for a nonempty draft that is not a Guid. Defaults to `Enter a valid Guid.`; an empty string keeps the default. */
    formatErrorMessage?: string;
    /** Localizable error for an empty required field. Defaults to `A value is required.`; an empty string keeps the default. */
    requiredErrorMessage?: string;
    /**
     * Change this value to discard the text draft even when the command value has not changed, such
     * as when an invalid draft already left the command value empty and the form is reset to empty.
     */
    resetKey?: unknown;
}

interface GuidControlProps extends WrappedFieldProps<Guid | undefined | null>, FieldAccessibilityProps {
    placeholder?: string;
    className?: string;
    pt?: GuidParts;
    formatErrorMessage?: string;
    requiredErrorMessage?: string;
    resetKey?: unknown;
    /** The bound command property. `asCommandFormField` consumes `fieldName`, so it is forwarded under this name. */
    boundFieldName?: string;
}

interface GuidDraft {
    value: unknown;
    resetKey: unknown;
    text: string;
}

const textForValue = (value: unknown) => (value instanceof Guid ? value.toString() : '');

// Mirrors Arc React's own source-text inference, so the field reports its errors under the same
// property name Arc binds when an accessor such as `command => command.sampleId` has no fieldName.
const propertyNameFromAccessor = (accessor: unknown): string => {
    if (typeof accessor !== 'function') return '';
    const match = accessor.toString().match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : '';
};

function GuidControl(props: GuidControlProps) {
    const { value: currentValue, boundFieldName: fieldName, resetKey, required } = props;
    const { getFieldError, customFieldErrors, setCustomFieldError } = useCommandFormContext<unknown>();
    const [draft, setDraft] = useState<GuidDraft>(() => ({ value: currentValue, resetKey, text: textForValue(currentValue) }));
    const synchronized = Object.is(draft.value, currentValue) && Object.is(draft.resetKey, resetKey);
    // Adopt an external value or reset during render; a delayed effect could overwrite ongoing typing.
    if (!synchronized) {
        setDraft({ value: currentValue, resetKey, text: textForValue(currentValue) });
    }
    const text = synchronized ? draft.text : textForValue(currentValue);
    const errorForText = (value: string): string | undefined => {
        if (value.length === 0) {
            return required ? props.requiredErrorMessage || defaultGuidRequiredErrorMessage : undefined;
        }
        return Guid.isGuid(value) ? undefined : props.formatErrorMessage || defaultGuidFormatErrorMessage;
    };
    const error = errorForText(text);
    const ownedErrorRef = useRef<string | undefined>(undefined);
    const latestGetFieldErrorRef = useRef(getFieldError);
    latestGetFieldErrorRef.current = getFieldError;

    // Only an error this field published may be cleared by it: an onFieldValidate or caller error
    // must survive a valid edit. Arc React 22.19.1+ reads custom errors live, which is what makes the
    // ownership check hold for writes made in the same event batch.
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

    const errors = [...new Set([error, ...props.errors].filter((message): message is string => Boolean(message)))];
    const invalid = errors.length > 0;
    const accessibility = useFieldAccessibility({ ...props, errors }, {
        id: props.pt?.root?.id,
        ariaLabel: props.pt?.root?.['aria-label'],
        ariaDescribedBy: props.pt?.root?.['aria-describedby'],
    });
    return (
        <>
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
                    // A partial or invalid draft writes undefined at once, never the previous identifier.
                    // Arc still owns command mutation, validation and execution; this field supplies an error.
                    publishError(undefined);
                    props.onChange(nextValue);
                    // Publish again after binding: onFieldValidate may have replaced the error synchronously.
                    publishError(errorForText(nextText));
                }}
                onBlur={props.onBlur}
                placeholder={props.placeholder}
                data-disabled={props.pt?.root?.disabled || undefined}
                data-invalid={invalid || undefined}
                data-readonly={props.pt?.root?.readOnly || undefined}
                data-cratis-part='input'
                className={['cratis-field-input', 'cratis:w-full', props.pt?.root?.className, props.className]
                    .filter(Boolean)
                    .join(' ')}
            />
            {accessibility.hiddenError}
        </>
    );
}

const GuidBinding = asCommandFormField<GuidControlProps>(GuidControl, { defaultValue: undefined });

function GuidFieldComponent<TCommand = unknown>(props: GuidFieldProps<TCommand>): ReactElement {
    const boundFieldName = props.fieldName || propertyNameFromAccessor(props.value) || undefined;
    return <GuidBinding<TCommand> {...props} boundFieldName={boundFieldName} />;
}

/**
 * Edits a scalar Fundamentals `Guid` command property as text, keeping the command value a native `Guid`.
 *
 * Partial or invalid text stays editable and leaves the command value `undefined`; the field reports a
 * format error, or a required error when a required field is empty, through the form's custom field
 * errors. Arc and Arc React 22.19.1 or newer refuse to execute a form with custom field errors, so an
 * invalid draft cannot be submitted. The field never generates an identifier and accepts every value
 * `Guid.isGuid` accepts, including the empty Guid.
 *
 * Not a default {@link AutoCommandForm} provider; register it explicitly:
 *
 * @example
 * ```tsx
 * registerFieldTypeProvider({ canHandle: (descriptor) => descriptor.type === Guid, component: GuidField });
 * ```
 */
export const GuidField = markAsCommandFormField(GuidFieldComponent);
