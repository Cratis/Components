// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useState } from 'react';
import type { ObjectContentEditorProps } from './ObjectContentEditor';
import type { Json, JsonSchemaProperty } from '../types/JsonSchema';
import { collectValidationErrors, validatePropertyValue } from './validation';

interface ValidationOptions extends Pick<ObjectContentEditorProps, 'object' | 'schema' | 'onValidationChange'> {
    editMode: boolean;
    navigationPath: string[];
}

export function useValidation({ object, schema, editMode, navigationPath, onValidationChange }: ValidationOptions) {
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const validateValue = useCallback(
        (propertyName: string, value: Json, property: JsonSchemaProperty): string | undefined =>
            validatePropertyValue(value, property, editMode || Boolean(schema.required?.includes(propertyName))),
        [schema, editMode],
    );

    useEffect(() => {
        if (!editMode || navigationPath.length > 0) return;
        const errors = collectValidationErrors(object, schema.properties || {}, validateValue);
        setValidationErrors(errors);
    }, [object, schema, editMode, navigationPath, validateValue]);

    useEffect(() => {
        if (editMode && onValidationChange) {
            const hasErrors = Object.keys(validationErrors).length > 0;
            onValidationChange(hasErrors);
        }
    }, [validationErrors, editMode, onValidationChange]);

    const validateChange = (propertyName: string, newValue: Json, property: JsonSchemaProperty) => {
        const validationError = validateValue(propertyName, newValue, property);
        setValidationErrors((previous) => {
            const newErrors = { ...previous };
            if (validationError) {
                newErrors[propertyName] = validationError;
            } else {
                delete newErrors[propertyName];
            }
            return newErrors;
        });
    };

    return { validationErrors, validateChange };
}
