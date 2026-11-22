// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState, useCallback } from 'react';
import { ObjectNavigationalBar } from '../ObjectNavigationalBar';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ChangeMeta } from '../types/ChangeMeta';
import type { Json, JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import { renderEditField } from './editField';
import { renderTable } from './table';
import { useNavigation } from './useNavigation';
import { useValidation } from './useValidation';

/**
 * Props for {@link ObjectContentEditor}.
 */
export interface ObjectContentEditorProps {
    /** The JSON value to display or edit. */
    object: Json;

    /** Optional snapshot timestamp displayed at the bottom of the editor. */
    timestamp?: Date;

    /**
     * JSON Schema describing the structure of {@link object}. Drives field
     * detection, label rendering, required-field markers, and per-field input
     * type selection in edit mode.
     */
    schema: JsonSchema;

    /**
     * When true, renders editable input fields for each property respecting
     * the JSON Schema's `type` and `format` annotations. Defaults to read-only.
     */
    editMode?: boolean;

    /**
     * Invoked with the updated object after any field edit. Required to
     * actually persist user changes when {@link editMode} is true.
     */
    onChange?: ChangeHandler<Json>;

    /**
     * Invoked whenever the validation state of the editor changes (true when
     * one or more fields fail their schema check). Useful for disabling a
     * surrounding Save button while errors are present.
     */
    onValidationChange?: (hasErrors: boolean) => void;

    /**
     * Extra CSS class names appended to the editor root, combined with the
     * default `order-content` class. For fine-grained styling of the internal
     * Components inputs, use product tokens and stable Cratis parts.
     */
    className?: string;
}

/**
 * Renders a structured view (or editor) of any JSON object whose shape is
 * described by a JSON Schema. In view mode it lays out properties as a labeled
 * table with breadcrumb-style navigation into nested objects and arrays. In
 * edit mode it switches to the appropriate input type for each property
 * (`InputText`, `InputNumber`, `Checkbox`, `Calendar`, `InputTextarea`).
 *
 * The component composes Cratis-owned controls internally. Restyle it through
 * semantic tokens, its root `className`, and documented descendant
 * `data-cratis-part` values rather than a provider-level renderer preset.
 *
 * @param props - {@link ObjectContentEditorProps}.
 */
export const ObjectContentEditor = ({
    object,
    timestamp,
    schema,
    editMode = false,
    onChange,
    onValidationChange,
    className,
}: ObjectContentEditorProps): React.JSX.Element => {
    const [navigationPath, setNavigationPath] = useState<string[]>([]);
    const { validationErrors, validateChange } = useValidation({
        object, schema, editMode, navigationPath, onValidationChange,
    });
    const { navigateTo, navigateToBreadcrumb, currentData, currentProperties } = useNavigation({
        object, schema, navigationPath, setNavigationPath,
    });

    const updateValue = useCallback(
        (propertyName: string, newValue: Json, meta: ChangeMeta) => {
            if (!onChange) return;

            const updatedObject = { ...(object as Record<string, Json>) };
            updatedObject[propertyName] = newValue;
            onChange(updatedObject, meta);
        },
        [object, onChange],
    );

    const renderEditableValue = (
        propertyName: string,
        property: JsonSchemaProperty,
        value: Json,
    ) => renderEditField({
        propertyName,
        property,
        value,
        error: validationErrors[propertyName],
        handleChange: (newValue, meta) => {
            updateValue(propertyName, newValue, meta);
            validateChange(propertyName, newValue, property);
        },
    });

    return (
        <div
            data-cratis-component='ObjectContentEditor'
            className={className ? `order-content ${className}` : 'order-content'}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <ObjectNavigationalBar
                navigationPath={navigationPath}
                onNavigate={navigateToBreadcrumb}
            />
            {renderTable({
                currentData,
                currentProperties,
                navigationPath,
                editMode,
                renderEditField: renderEditableValue,
                navigateTo,
            })}
            {timestamp && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '12px',
                        background: 'var(--cratis-highlight-bg)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'var(--cratis-text-color)',
                    }}
                >
                    Snapshot captured: {timestamp.toLocaleString()}
                </div>
            )}
        </div>
    );
};
