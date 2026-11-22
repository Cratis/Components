// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MutableRefObject } from 'react';
import { Guid } from '@cratis/fundamentals';

const defaultGuidFormatErrorMessage = 'Enter a valid Guid.';

const defaultGuidRequiredErrorMessage = 'A value is required.';

/** The settings that decide which error a Guid draft reports. */
export interface GuidErrorSettings {
    required?: boolean;
    formatErrorMessage?: string;
    requiredErrorMessage?: string;
}

/** Returns the required or format error for a draft, or undefined when the draft is acceptable. */
export const guidErrorForText = (value: string, settings: GuidErrorSettings): string | undefined => {
    if (value.length === 0) {
        return settings.required ? settings.requiredErrorMessage || defaultGuidRequiredErrorMessage : undefined;
    }
    return Guid.isGuid(value) ? undefined : settings.formatErrorMessage || defaultGuidFormatErrorMessage;
};

/** The form access and ownership record a Guid field publishes its error through. */
export interface GuidErrorPublisher {
    fieldName?: string;
    getFieldError(propertyName: string): string | undefined;
    setCustomFieldError(fieldName: string, error: string | undefined): void;
    ownedErrorRef: MutableRefObject<string | undefined>;
}

// The field writes only into an empty slot or over the error it published itself: an
// onFieldValidate or caller error is never overwritten or cleared. Arc React 22.19.1+ reads custom
// errors live, which is what makes the ownership check hold for writes made in the same event batch.
export const publishOwnedGuidError = (
    publisher: GuidErrorPublisher,
    nextError: string | undefined,
    current = publisher.fieldName ? publisher.getFieldError(publisher.fieldName) : undefined,
) => {
    const { fieldName, ownedErrorRef } = publisher;
    if (!fieldName) return;
    if (current && current !== ownedErrorRef.current) {
        ownedErrorRef.current = undefined;
        return;
    }
    if (nextError !== current) {
        publisher.setCustomFieldError(fieldName, nextError);
    }
    ownedErrorRef.current = nextError;
};

/** Reads the custom error currently held for the bound field, treating an empty message as none. */
export const customGuidErrorFor = (customFieldErrors: Record<string, string>, fieldName: string | undefined) =>
    fieldName && Object.hasOwn(customFieldErrors, fieldName) ? customFieldErrors[fieldName] || undefined : undefined;

/** Publish when the draft's own error changes, or refill an emptied slot so an invalid draft stays blocking. */
export const shouldRepublishGuidError = (
    error: string | undefined,
    ownedError: string | undefined,
    customError: string | undefined,
): boolean => error !== ownedError || Boolean(error && !customError);

/** Whether the field's own error is still the one the form holds for the bound field. */
export const holdsOwnedGuidError = (
    fieldName: string,
    ownedError: string | undefined,
    getFieldError: (propertyName: string) => string | undefined,
): boolean => Boolean(ownedError && getFieldError(fieldName) === ownedError);

/** Combines the draft error with the bound errors, dropping empty and repeated messages. */
export const mergeGuidErrors = (error: string | undefined, errors: readonly string[]): string[] =>
    [...new Set([error, ...errors].filter((message): message is string => Boolean(message)))];
