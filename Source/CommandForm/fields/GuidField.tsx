// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, type InputHTMLAttributes, type ReactElement } from 'react';
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
import {
    customGuidErrorFor,
    guidErrorForText,
    holdsOwnedGuidError,
    mergeGuidErrors,
    publishOwnedGuidError,
    shouldRepublishGuidError,
    type GuidErrorPublisher,
} from './guidFieldErrors';
import { useGuidDraft } from './useGuidDraft';

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

type GuidRootPart = InputHTMLAttributes<HTMLInputElement> | undefined;

// Mirrors Arc React's own source-text inference, so the field reports its errors under the same
// property name Arc binds when an accessor such as `command => command.sampleId` has no fieldName.
const propertyNameFromAccessor = (accessor: unknown): string => {
    if (typeof accessor !== 'function') return '';
    const match = accessor.toString().match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : '';
};

const inputClassName = (rootPart: GuidRootPart, className: string | undefined) =>
    ['cratis-field-input', 'cratis:w-full', rootPart?.className, className]
        .filter(Boolean)
        .join(' ');

const accessibilityFallbacks = (rootPart: GuidRootPart) => ({
    id: rootPart?.id,
    ariaLabel: rootPart?.['aria-label'],
    ariaDescribedBy: rootPart?.['aria-describedby'],
});

function GuidControl(props: GuidControlProps) {
    const { value: currentValue, boundFieldName: fieldName, resetKey, required } = props;
    const { getFieldError, customFieldErrors, setCustomFieldError } = useCommandFormContext<unknown>();
    const { text, setDraft } = useGuidDraft(currentValue, resetKey);
    const error = guidErrorForText(text, props);
    const ownedErrorRef = useRef<string | undefined>(undefined);
    const latestGetFieldErrorRef = useRef(getFieldError);
    latestGetFieldErrorRef.current = getFieldError;

    const publisher: GuidErrorPublisher = { fieldName, getFieldError, setCustomFieldError, ownedErrorRef };
    const publishError = (nextError: string | undefined, current?: string) =>
        publishOwnedGuidError(publisher, nextError, current);
    const customError = customGuidErrorFor(customFieldErrors, fieldName);
    useEffect(() => {
        if (shouldRepublishGuidError(error, ownedErrorRef.current, customError)) {
            publishError(error, customError);
        }
    });
    useEffect(() => () => {
        if (fieldName && holdsOwnedGuidError(fieldName, ownedErrorRef.current, latestGetFieldErrorRef.current)) {
            setCustomFieldError(fieldName, undefined);
        }
    }, [fieldName, setCustomFieldError]);

    const errors = mergeGuidErrors(error, props.errors);
    const invalid = errors.length > 0;
    const rootPart = props.pt?.root;
    const accessibility = useFieldAccessibility({ ...props, errors }, accessibilityFallbacks(rootPart));
    return (
        <>
            <input
                {...rootPart}
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
                    publishError(guidErrorForText(nextText, props));
                }}
                onBlur={props.onBlur}
                placeholder={props.placeholder}
                data-disabled={rootPart?.disabled || undefined}
                data-invalid={invalid || undefined}
                data-readonly={rootPart?.readOnly || undefined}
                data-cratis-part='input'
                className={inputClassName(rootPart, props.className)}
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
