// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useState } from 'react';
import type { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import { validatePropertyName } from './schemaHelpers';
import { findSchemaAtPath } from './schemaDocument';
import type { Property } from './Tree/Property';
import { jsonSchemaToProperties } from './Tree/schemaConversion';

type CustomNameValidator = (name: string, property: Property, siblings: Property[]) => string | undefined;

const toPropertyRows = (level: JsonSchema, path: string[]): JsonSchemaProperty[] =>
    Object.entries(level.properties ?? {}).map(([name, property], index) => ({
        id: `prop-${path.join('-')}-${index}`,
        name,
        type: property.type || 'string',
        format: property.format,
        description: property.description,
        items: property.items,
        properties: property.properties,
        // A property's own `required` array (populated when its `type` is "object") lists which of *its*
        // properties are required. It is scoped to this property alone — never to the parent schema's
        // `required` array — and is carried through verbatim so navigating into it sees it intact.
        required: property.required,
    }));

const rowError = (row: JsonSchemaProperty, rows: JsonSchemaProperty[], level: Property[], custom?: CustomNameValidator) => {
    const error = validatePropertyName(row.name ?? '', row.id!, rows);
    if (error || !custom) return error;

    const property = level.find((candidate) => candidate.name === row.name);
    return property ? custom(property.name, property, level) : undefined;
};

/**
 * Derives the rows of the current schema level and, in edit mode, their name validation errors.
 * @param currentSchema The working schema.
 * @param currentPath The drill-down path.
 * @param isEditMode Whether the editor is editing.
 * @param customValidator The host's extra property name check.
 * @returns The rows and the validation error per row id.
 */
export const useSchemaRows = (
    currentSchema: JsonSchema,
    currentPath: string[],
    isEditMode: boolean,
    customValidator?: CustomNameValidator,
) => {
    const [properties, setProperties] = useState<JsonSchemaProperty[]>([]);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validate = useCallback(
        (rows: JsonSchemaProperty[], level: Property[]) => {
            const errors: Record<string, string> = {};
            rows.forEach((row) => {
                const error = rowError(row, rows, level, customValidator);
                if (error) errors[row.id!] = error;
            });
            setValidationErrors(errors);
        },
        [customValidator],
    );

    useEffect(() => {
        const level = findSchemaAtPath(currentSchema, currentPath);
        if (!level) return;

        const rows = toPropertyRows(level, currentPath);
        setProperties(rows);
        if (isEditMode) {
            validate(rows, jsonSchemaToProperties(level));
        }
    }, [currentPath, currentSchema, isEditMode]);

    return { properties, validationErrors };
};
