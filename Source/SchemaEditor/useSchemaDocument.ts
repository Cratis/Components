// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useState } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { JsonSchema } from '../types/JsonSchema';
import { cloneSchema } from './schemaDocument';

/** What the document hook reports back to the host. */
export interface SchemaDocumentOptions {
    schema: JsonSchema;
    editMode?: boolean;
    onChange?: ChangeHandler<JsonSchema>;
    onSave?: () => void;
    onCancel?: () => void;
}

/**
 * Holds the schema being edited and the Edit, Save and Cancel workflow around it.
 * @param options The supplied schema, the initial edit mode and the host callbacks.
 * @returns The working schema, whether it is invalid, the edit mode and the workflow actions.
 */
export const useSchemaDocument = ({ schema, editMode, onChange, onSave, onCancel }: SchemaDocumentOptions) => {
    const [initialParsedSchema] = useState<JsonSchema | undefined>(() => cloneSchema(schema));
    const [currentSchema, setCurrentSchema] = useState<JsonSchema>(initialParsedSchema ?? {});
    const [isEditMode, setIsEditMode] = useState(editMode ?? false);
    const [initialSchema, setInitialSchema] = useState<JsonSchema>(initialParsedSchema ?? {});
    const [schemaJsonIsInvalid, setSchemaJsonIsInvalid] = useState(initialParsedSchema === undefined);

    useEffect(() => {
        const parsedSchema = cloneSchema(schema);
        if (!parsedSchema) {
            setSchemaJsonIsInvalid(true);
            return;
        }

        setSchemaJsonIsInvalid(false);
        setCurrentSchema(parsedSchema);
        setInitialSchema(parsedSchema);
    }, [schema]);

    const handleSave = useCallback(() => {
        if (schemaJsonIsInvalid) return;

        onSave?.();
        setIsEditMode(false);
    }, [onSave, schemaJsonIsInvalid]);

    const handleCancel = useCallback(() => {
        const restoredSchema = cloneSchema(initialSchema);
        const changedSchema = cloneSchema(initialSchema);
        if (!restoredSchema || !changedSchema) {
            setSchemaJsonIsInvalid(true);
            return;
        }

        const hasChanges = JSON.stringify(currentSchema) !== JSON.stringify(initialSchema);
        setCurrentSchema(restoredSchema);
        if (hasChanges) {
            onChange?.(changedSchema, { source: 'reset' });
        }
        setIsEditMode(false);
        onCancel?.();
    }, [currentSchema, initialSchema, onChange, onCancel]);

    const handleEdit = useCallback(() => {
        if (schemaJsonIsInvalid) return;

        const parsedSchema = cloneSchema(currentSchema);
        if (!parsedSchema) {
            setSchemaJsonIsInvalid(true);
            return;
        }

        setInitialSchema(parsedSchema);
        setIsEditMode(true);
    }, [currentSchema, schemaJsonIsInvalid]);

    return {
        currentSchema,
        setCurrentSchema,
        schemaJsonIsInvalid,
        setSchemaJsonIsInvalid,
        isEditMode,
        handleEdit,
        handleSave,
        handleCancel,
    };
};
