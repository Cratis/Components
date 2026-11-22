// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Json, JsonSchemaProperty } from '../types/JsonSchema';

function isEmpty(value: Json) {
    return value === null || value === undefined || value === '';
}

function validateString(value: string, property: JsonSchemaProperty): string | undefined {
    if (!value) return undefined;
    switch (property.format) {
        case 'email':
            return value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ? undefined : 'Invalid email format';
        case 'uri':
            return value.match(/^https?:\/\/.+/) ? undefined : 'Invalid URI format';
        default:
            return undefined;
    }
}

function validateNumber(value: Json): string | undefined {
    return !isEmpty(value) && isNaN(Number(value)) ? 'Must be a valid number' : undefined;
}

export function validatePropertyValue(value: Json, property: JsonSchemaProperty, isRequired: boolean): string | undefined {
    if (isRequired && isEmpty(value)) {
        return 'This field is required';
    }
    if (property.type === 'string' && typeof value === 'string') {
        return validateString(value, property);
    }
    if (property.type === 'number' || property.type === 'integer') {
        return validateNumber(value);
    }
    return undefined;
}

export function collectValidationErrors(
    object: Json,
    properties: Record<string, JsonSchemaProperty>,
    validateValue: (propertyName: string, value: Json, property: JsonSchemaProperty) => string | undefined,
) {
    const errors: Record<string, string> = {};
    Object.entries(properties).forEach(([propertyName, property]) => {
        const value = (object as Record<string, Json>)[propertyName];
        const error = validateValue(propertyName, value, property);
        if (error) {
            errors[propertyName] = error;
        }
    });
    return errors;
}
