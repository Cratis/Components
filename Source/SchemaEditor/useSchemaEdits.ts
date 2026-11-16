// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import { cloneSchema, findSchemaAtPath, updateSchemaAtPath } from './schemaDocument';
import {
    addPropertyTo,
    editProperty,
    removePropertyFrom,
    setArrayItemType,
    setKeyIn,
    setRequiredIn,
} from './schemaPropertyEdits';
import type { Property } from './Tree/Property';
import { jsonSchemaToProperties } from './Tree/schemaConversion';

/** The working document and the host hooks the edits report to. */
export interface SchemaEditsOptions {
    currentSchema: JsonSchema;
    currentPath: string[];
    setCurrentSchema: (schema: JsonSchema) => void;
    markInvalid: () => void;
    onChange?: ChangeHandler<JsonSchema>;
    isPropertyProtected?: (property: Property) => boolean;
    onPropertyRemoved?: (property: Property) => void;
    onPropertyRenamed?: (property: Property, previousName: string) => void;
}

/**
 * The edits the table layout applies to the schema level at the current path.
 * @param options The working document and the host hooks.
 * @returns The edit actions and the protected check.
 */
export const useSchemaEdits = ({
    currentSchema,
    currentPath,
    setCurrentSchema,
    markInvalid,
    onChange,
    isPropertyProtected,
    onPropertyRemoved,
    onPropertyRenamed,
}: SchemaEditsOptions) => {
    const applyEdit = useCallback(
        (updater: (level: JsonSchema) => JsonSchema) => {
            const copy = cloneSchema(currentSchema);
            if (!copy) {
                markInvalid();
                return;
            }

            const updated = updateSchemaAtPath(copy, currentPath, updater);
            setCurrentSchema(updated);
            onChange?.(updated, { source: 'user' });
        },
        [currentSchema, currentPath, onChange, setCurrentSchema, markInvalid],
    );

    /** The editable view of the properties at the current path, for the host callbacks. */
    const getLevelProperties = useCallback(
        () => jsonSchemaToProperties(findSchemaAtPath(currentSchema, currentPath)),
        [currentSchema, currentPath],
    );

    const isProtected = useCallback(
        (propertyName: string) => {
            if (!isPropertyProtected) return false;
            const property = getLevelProperties().find((candidate) => candidate.name === propertyName);
            return property !== undefined && isPropertyProtected(property);
        },
        [isPropertyProtected, getLevelProperties],
    );

    const addProperty = useCallback(() => applyEdit(addPropertyTo), [applyEdit]);

    const removeProperty = useCallback(
        (propertyName: string) => {
            const removed = getLevelProperties().find((candidate) => candidate.name === propertyName);
            if (removed && isPropertyProtected?.(removed)) return;
            applyEdit((level) => removePropertyFrom(level, propertyName));
            if (removed) onPropertyRemoved?.(removed);
        },
        [applyEdit, getLevelProperties, isPropertyProtected, onPropertyRemoved],
    );

    const setRequired = useCallback(
        (propertyName: string, isRequired: boolean) =>
            applyEdit((level) => setRequiredIn(level, propertyName, isRequired)),
        [applyEdit],
    );

    const setKey = useCallback((propertyName: string) => applyEdit((level) => setKeyIn(level, propertyName)), [applyEdit]);

    const updateProperty = useCallback(
        (
            oldName: string,
            field: keyof JsonSchemaProperty,
            value: unknown,
            additionalUpdates?: Partial<JsonSchemaProperty>,
        ) => {
            let renamed: Property | undefined;
            applyEdit((level) => {
                const result = editProperty(level, oldName, { field, value, additionalUpdates }, isProtected(oldName));
                renamed = result.renamed;
                return result.schema;
            });
            if (renamed) onPropertyRenamed?.(renamed, oldName);
        },
        [applyEdit, isProtected, onPropertyRenamed],
    );

    const updateArrayItemType = useCallback(
        (propertyName: string, itemType: string) =>
            applyEdit((level) => setArrayItemType(level, propertyName, itemType)),
        [applyEdit],
    );

    return { addProperty, removeProperty, setRequired, setKey, updateProperty, updateArrayItemType, isProtected };
};
