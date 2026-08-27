// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../Common/Button';
import { DataTableCore } from '../DataTables/DataTableCore';
import { Column } from '../DataTables/Column';
import { ActionMenubar, type ActionMenuItem } from '../Common/ActionMenubar';
import { Tooltip } from '../Common/Tooltip';
import { Message } from '../Display/Message';
import * as faIcons from 'react-icons/fa6';
import { NameCell } from './NameCell';
import { TypeCell } from './TypeCell';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import { type TypeFormat, DEFAULT_TYPE_FORMATS } from '../types/TypeFormat';
import { validatePropertyName, buildBreadcrumbItems } from './schemaHelpers';

/**
 * User-facing strings for {@link SchemaEditor}. Every field is optional; pass a
 * partial `labels` to override any of them (for localization). Omitted fields
 * fall back to {@link defaultSchemaEditorLabels} (English).
 */
export interface SchemaEditorLabels {
    /** Menu action that enters edit mode. */
    edit: string;
    /** Menu action that saves changes. */
    save: string;
    /** Menu action that cancels editing. */
    cancel: string;
    /** Menu action that adds a property. */
    addProperty: string;
    /** Accessible name for the action menubar. */
    actions: string;
    /** Accessible name and tooltip for the back button. */
    navigateBack: string;
    /** Shown when the schema has no properties. */
    emptyMessage: string;
    /** Accessible name for the "drill into array item definition" button. */
    navigateToItemDefinition: string;
    /** Accessible name for the "drill into object properties" button. */
    navigateToProperties: string;
    /** Accessible name for a property-name input. */
    propertyName: string;
    /** Accessible name for a property-type selector. */
    propertyType: string;
    /** Accessible name for an array item-type selector. */
    arrayItemType: string;
    /** Accessible name for the "remove property" button. */
    deleteProperty: string;
    /** Validation message shown when the schema cannot be represented as valid JSON. */
    invalidJson: string;
}

/** English defaults for {@link SchemaEditorLabels}. */
export const defaultSchemaEditorLabels: SchemaEditorLabels = {
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    addProperty: 'Add Property',
    actions: 'Actions',
    navigateBack: 'Navigate back',
    emptyMessage: 'No properties defined',
    navigateToItemDefinition: 'Navigate to item definition',
    navigateToProperties: 'Navigate to object properties',
    propertyName: 'Property name',
    propertyType: 'Property type',
    arrayItemType: 'Array item type',
    deleteProperty: 'Delete property',
    invalidJson: 'The schema must contain valid JSON before it can be edited.',
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Recursively validates that a parsed schema node, its required names, and every nested
 * `properties`, `definitions`, and `items` schema match the supported object shape. A JSON-valid
 * document can still contain malformed nested values (for example `properties.foo: null`,
 * `required: {}`, or `items: "string"`) that later code dereferences as schema data; those are
 * rejected here rather than crashing downstream.
 */
const isValidSchemaNode = (node: unknown): node is JsonSchema => {
    if (!isPlainObject(node)) {
        return false;
    }

    if (
        node.required !== undefined &&
        (!Array.isArray(node.required) ||
            !node.required.every((propertyName) => typeof propertyName === 'string'))
    ) {
        return false;
    }

    for (const nestedSchemas of [node.properties, node.definitions]) {
        if (nestedSchemas === undefined) continue;
        if (!isPlainObject(nestedSchemas)) return false;
        for (const nestedSchema of Object.values(nestedSchemas)) {
            if (!isValidSchemaNode(nestedSchema)) return false;
        }
    }

    if (node.items !== undefined && !isValidSchemaNode(node.items)) {
        return false;
    }

    return true;
};

const cloneSchema = (schema: JsonSchema): JsonSchema | undefined => {
    try {
        const serializedSchema = JSON.stringify(schema);
        if (serializedSchema === undefined) return undefined;

        const parsedSchema: unknown = JSON.parse(serializedSchema);
        if (!isValidSchemaNode(parsedSchema)) {
            return undefined;
        }

        return parsedSchema;
    } catch {
        return undefined;
    }
};

const asJsonSchema = (property: JsonSchemaProperty): JsonSchema => {
    // SAFETY: A nested "object" property has the same editable shape as a schema —
    // `properties`, `items`, and `required` all mean the same thing on both types.
    return property as unknown as JsonSchema;
};

const asJsonSchemaProperty = (schema: JsonSchema): JsonSchemaProperty => {
    // SAFETY: The inverse of asJsonSchema; the shapes are structurally interchangeable.
    return schema as unknown as JsonSchemaProperty;
};

/**
 * Props for {@link SchemaEditor}.
 */
export interface SchemaEditorProps {
    /** The JSON Schema being viewed or edited. */
    schema: JsonSchema;

    /** Optional event-type label displayed in the editor header. */
    eventTypeName?: string;

    /** When false, the Edit action is hidden; defaults to `true`. */
    canEdit?: boolean;

    /**
     * When {@link canEdit} is false, this string is shown as a tooltip on the
     * disabled Edit menu item to explain why editing is unavailable.
     */
    canNotEditReason?: string;

    /** Invoked with the updated schema and optional metadata after any structural change. */
    onChange?: ChangeHandler<JsonSchema>;

    /** Invoked when the user activates the Save action. */
    onSave?: () => void;

    /** Invoked when the user activates the Cancel action. */
    onCancel?: () => void;

    /** Initial edit-mode state; defaults to `false` (read-only). */
    editMode?: boolean;

    /** When true, hides the Save menu item even while in edit mode. */
    saveDisabled?: boolean;

    /** When true, hides the Cancel menu item even while in edit mode. */
    cancelDisabled?: boolean;

    /**
     * Override the list of selectable type formats per JSON Schema type. Each
     * entry contributes options to the type-format dropdown shown in edit
     * mode. Defaults to {@link DEFAULT_TYPE_FORMATS}.
     */
    typeFormats?: TypeFormat[];

    /**
     * Extra CSS class names appended to the editor root. Combined with the
     * default `schema-editor` class. For fine-grained styling of internal
     * Components controls, use product tokens and stable Cratis parts.
     */
    className?: string;

    /** Override any user-facing string (for localization). See {@link SchemaEditorLabels}. */
    labels?: Partial<SchemaEditorLabels>;
}

/**
 * A breadcrumb-navigated editor for JSON Schemas. Lets users browse nested
 * `object` and `array` property definitions, add or remove properties, change
 * types and formats, and validate naming rules in place. Designed to drive
 * UIs around event payload schemas and similar structural documents.
 *
 * The editor composes a Cratis data table, action toolbar, and form widgets
 * internally. Restyle it through semantic tokens, the editor root `className`,
 * and documented `data-cratis-part` values rather than a provider preset.
 *
 * @param props - {@link SchemaEditorProps}.
 */
export const SchemaEditor = ({
    schema,
    eventTypeName = '',
    canEdit = true,
    canNotEditReason,
    onChange,
    onSave,
    onCancel,
    editMode,
    saveDisabled = false,
    cancelDisabled = false,
    typeFormats = DEFAULT_TYPE_FORMATS,
    className,
    labels,
}: SchemaEditorProps) => {
    const l = useMemo(() => ({ ...defaultSchemaEditorLabels, ...labels }), [labels]);
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [properties, setProperties] = useState<JsonSchemaProperty[]>([]);
    const [initialParsedSchema] = useState<JsonSchema | undefined>(() =>
        cloneSchema(schema),
    );
    const [currentSchema, setCurrentSchema] = useState<JsonSchema>(
        initialParsedSchema ?? {},
    );
    const [isEditMode, setIsEditMode] = useState(editMode ?? false);
    const [initialSchema, setInitialSchema] = useState<JsonSchema>(
        initialParsedSchema ?? {},
    );
    const [schemaJsonIsInvalid, setSchemaJsonIsInvalid] = useState(
        initialParsedSchema === undefined,
    );
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isEditMode) {
            setCurrentPath([]);
        }
    }, [isEditMode]);

    const validateAllProperties = useCallback(
        (properties: JsonSchemaProperty[]) => {
            const errors: Record<string, string> = {};

            properties.forEach((prop) => {
                const error = validatePropertyName(prop.name ?? '', prop.id!, properties);
                if (error) {
                    errors[prop.id!] = error;
                }
            });

            setValidationErrors(errors);
            return Object.keys(errors).length === 0;
        },
        [validatePropertyName],
    );

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

    useEffect(() => {
        loadPropertiesForCurrentPath();
    }, [currentPath, currentSchema, isEditMode]);

    const loadPropertiesForCurrentPath = () => {
        let targetSchema: JsonSchema | JsonSchemaProperty = currentSchema;

        for (const segment of currentPath) {
            if (targetSchema.type === 'array' && segment === '$items') {
                targetSchema = targetSchema.items || {};
            } else if (targetSchema.properties && targetSchema.properties[segment]) {
                targetSchema = targetSchema.properties[segment] as
                    JsonSchema | JsonSchemaProperty;
            } else {
                return;
            }
        }

        const schemaProps: JsonSchemaProperty[] = [];
        if (targetSchema.properties) {
            let idCounter = 0;
            for (const [name, property] of Object.entries(targetSchema.properties)) {
                schemaProps.push({
                    id: `prop-${currentPath.join('-')}-${idCounter++}`,
                    name,
                    type: property.type || 'string',
                    format: property.format,
                    description: property.description,
                    items: property.items,
                    properties: property.properties,
                    // A property's own `required` array (populated when its `type`
                    // is "object") lists which of *its* properties are required.
                    // It is scoped to this property alone — never to the parent
                    // schema's `required` array — and is carried through verbatim
                    // so navigating into it (see asJsonSchema) sees it intact.
                    required: property.required,
                });
            }
        }

        setProperties(schemaProps);
        if (isEditMode) {
            validateAllProperties(schemaProps);
        }
    };

    const updateSchemaAtPath = useCallback(
        (path: string[], updater: (schema: JsonSchema) => JsonSchema) => {
            const newSchema = cloneSchema(currentSchema);
            if (!newSchema) {
                setSchemaJsonIsInvalid(true);
                return;
            }

            if (path.length === 0) {
                const updated = updater(newSchema);
                setCurrentSchema(updated);
                onChange?.(updated, { source: 'user' });
                return;
            }

            let targetSchema = newSchema;
            for (let i = 0; i < path.length - 1; i++) {
                const segment = path[i];
                if (targetSchema.type === 'array' && segment === '$items') {
                    if (!targetSchema.items) {
                        targetSchema.items = { type: 'object', properties: {} };
                    }
                    targetSchema = targetSchema.items;
                } else if (targetSchema.properties && targetSchema.properties[segment]) {
                    targetSchema = asJsonSchema(targetSchema.properties[segment]);
                }
            }

            const lastSegment = path[path.length - 1];
            if (targetSchema.type === 'array' && lastSegment === '$items') {
                targetSchema.items = updater(targetSchema.items || {});
            } else {
                if (!targetSchema.properties) {
                    targetSchema.properties = {};
                }
                const propertySchema = targetSchema.properties[lastSegment];
                targetSchema.properties[lastSegment] = asJsonSchemaProperty(
                    updater(propertySchema ? asJsonSchema(propertySchema) : {}),
                );
            }

            setCurrentSchema(newSchema);
            onChange?.(newSchema, { source: 'user' });
        },
        [currentSchema, onChange],
    );

    const addProperty = useCallback(() => {
        updateSchemaAtPath(currentPath, (schema) => {
            const newProps = { ...(schema.properties || {}) };
            let newName = 'newProperty';
            let counter = 1;
            while (newProps[newName]) {
                newName = `newProperty${counter++}`;
            }
            newProps[newName] = { type: 'string' };
            return { ...schema, properties: newProps };
        });
    }, [currentPath, updateSchemaAtPath]);

    const removeProperty = useCallback(
        (propertyName: string) => {
            updateSchemaAtPath(currentPath, (schema) => {
                const newProps = { ...(schema.properties || {}) };
                delete newProps[propertyName];

                // Deleting a property must also drop it from this schema's own
                // `required` array, or the array keeps naming a property that no
                // longer exists in `properties`.
                const updated: JsonSchema = { ...schema, properties: newProps };
                if (schema.required?.includes(propertyName)) {
                    updated.required = schema.required.filter(
                        (name) => name !== propertyName,
                    );
                }

                return updated;
            });
        },
        [currentPath, updateSchemaAtPath],
    );

    const updateProperty = useCallback(
        (
            oldName: string,
            field: keyof JsonSchemaProperty,
            value: unknown,
            additionalUpdates?: Partial<JsonSchemaProperty>,
        ) => {
            updateSchemaAtPath(currentPath, (schema) => {
                const newProps = { ...(schema.properties || {}) };
                const prop = { ...(newProps[oldName] || {}) };

                let newRequired = schema.required;

                if (field === 'name') {
                    const newName = value as string;
                    if (newName !== oldName && !newProps[newName]) {
                        newProps[newName] = prop;
                        delete newProps[oldName];

                        // Renaming a required property must keep the `required`
                        // array pointing at the new name, or it goes stale and
                        // silently references a property that no longer exists.
                        if (schema.required?.includes(oldName)) {
                            newRequired = schema.required.map((name) =>
                                name === oldName ? newName : name,
                            );
                        }
                    }
                } else if (field === 'type') {
                    prop.type = value as string;
                    if (value === 'array') {
                        prop.items = { type: 'string' };
                        delete prop.format;
                        // Only an "object" property has a meaningful `required`
                        // array of its own; any prior one is now stale.
                        delete prop.required;
                    } else if (value === 'object') {
                        prop.properties = {};
                        delete prop.format;
                        delete prop.items;
                        // Starting fresh with empty `properties`, so any prior
                        // `required` array (naming properties that no longer
                        // exist here) would be stale.
                        delete prop.required;
                    } else {
                        delete prop.items;
                        delete prop.properties;
                        delete prop.required;
                    }

                    if (additionalUpdates) {
                        if ('format' in additionalUpdates) {
                            if (additionalUpdates.format) {
                                prop.format = additionalUpdates.format as string;
                            } else {
                                delete prop.format;
                            }
                        }
                    }

                    newProps[oldName] = prop;
                } else if (field === 'format') {
                    if (value && value !== 'none') {
                        prop.format = value as string;
                    } else {
                        delete prop.format;
                    }
                    newProps[oldName] = prop;
                }

                return { ...schema, properties: newProps, required: newRequired };
            });
        },
        [currentPath, updateSchemaAtPath],
    );

    const updateArrayItemType = useCallback(
        (propertyName: string, itemType: string) => {
            updateSchemaAtPath(currentPath, (schema) => {
                const newProps = { ...(schema.properties || {}) };
                const prop = { ...(newProps[propertyName] || {}) };

                if (itemType === 'object') {
                    prop.items = { type: 'object', properties: {} };
                } else if (itemType === 'array') {
                    prop.items = { type: 'array', items: { type: 'string' } };
                } else {
                    prop.items = { type: itemType };
                }

                newProps[propertyName] = prop;
                return { ...schema, properties: newProps };
            });
        },
        [currentPath, updateSchemaAtPath],
    );

    const navigateToProperty = useCallback(
        (propertyName: string) => {
            setCurrentPath([...currentPath, propertyName]);
        },
        [currentPath],
    );

    const navigateToArrayItems = useCallback(
        (propertyName: string) => {
            setCurrentPath([...currentPath, propertyName, '$items']);
        },
        [currentPath],
    );

    const navigateBack = useCallback(() => {
        if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
        }
    }, [currentPath]);

    const navigateToBreadcrumb = useCallback(
        (index: number) => {
            const items = getBreadcrumbItems();
            setCurrentPath(items[index].path);
        },
        [currentPath, eventTypeName],
    );

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

        setCurrentSchema(restoredSchema);
        onChange?.(changedSchema, { source: 'reset' });
        setIsEditMode(false);
        onCancel?.();
    }, [initialSchema, onChange, onCancel]);

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

    const getBreadcrumbItems = () => buildBreadcrumbItems(eventTypeName, currentPath);

    const getCurrentDescription = useCallback(() => {
        let targetSchema: JsonSchema | JsonSchemaProperty = currentSchema;

        for (const segment of currentPath) {
            if (targetSchema.type === 'array' && segment === '$items') {
                targetSchema = targetSchema.items || {};
            } else if (targetSchema.properties && targetSchema.properties[segment]) {
                targetSchema = targetSchema.properties[segment] as
                    JsonSchema | JsonSchemaProperty;
            } else {
                return undefined;
            }
        }

        return targetSchema.description;
    }, [currentSchema, currentPath]);

    const hasValidationErrors =
        schemaJsonIsInvalid || Object.keys(validationErrors).length > 0;

    const menuItems = useMemo<ActionMenuItem[]>(
        () => [
            ...(isEditMode
                ? []
                : [
                      {
                          label: l.edit,
                          icon: <faIcons.FaPencil className='cratis:mr-2' />,
                          command:
                              canEdit && !schemaJsonIsInvalid ? handleEdit : undefined,
                          disabled: schemaJsonIsInvalid,
                          className: canEdit ? undefined : 'edit-disabled-with-reason',
                          template:
                              !canEdit && canNotEditReason
                                  ? (item: ActionMenuItem) => (
                                        <Tooltip
                                            content={canNotEditReason}
                                            position='bottom'
                                        >
                                            <button
                                                type='button'
                                                aria-disabled='true'
                                                style={{
                                                    border: 0,
                                                    background: 'transparent',
                                                    color: 'inherit',
                                                    cursor: 'not-allowed',
                                                    opacity: 0.6,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                }}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </button>
                                        </Tooltip>
                                    )
                                  : undefined,
                      },
                  ]),
            ...(isEditMode
                ? [
                      ...(saveDisabled
                          ? []
                          : [
                                {
                                    label: l.save,
                                    icon: <faIcons.FaCheck className='cratis:mr-2' />,
                                    command: hasValidationErrors ? undefined : handleSave,
                                    disabled: hasValidationErrors,
                                },
                            ]),
                      ...(cancelDisabled
                          ? []
                          : [
                                {
                                    label: l.cancel,
                                    icon: <faIcons.FaXmark className='cratis:mr-2' />,
                                    command: handleCancel,
                                },
                            ]),
                      {
                          label: l.addProperty,
                          icon: <faIcons.FaPlus className='cratis:mr-2' />,
                          command: schemaJsonIsInvalid ? undefined : addProperty,
                          disabled: schemaJsonIsInvalid,
                      },
                  ]
                : []),
        ],
        [
            isEditMode,
            handleSave,
            handleCancel,
            handleEdit,
            addProperty,
            canEdit,
            canNotEditReason,
            hasValidationErrors,
            schemaJsonIsInvalid,
            saveDisabled,
            cancelDisabled,
            l,
        ],
    );

    const breadcrumbItems = getBreadcrumbItems();
    const isAtRoot = currentPath.length === 0;
    const currentDescription = getCurrentDescription();

    return (
        <div
            className={className ? `schema-editor ${className}` : 'schema-editor'}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <div className='cratis:px-4 cratis:py-4'>
                <div className='schema-editor-menubar'>
                    <ActionMenubar aria-label={l.actions} model={menuItems} />
                </div>
                {schemaJsonIsInvalid && (
                    <Message
                        severity='error'
                        text={l.invalidJson}
                        className='cratis:mt-3'
                    />
                )}
            </div>

            <div className='cratis:px-4 cratis:py-2 cratis-schema-editor-bottom-border'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tooltip content={l.navigateBack} position='top'>
                        <Button
                            variant='ghost'
                            size='small'
                            icon={<faIcons.FaArrowLeft />}
                            onClick={navigateBack}
                            disabled={isAtRoot}
                            aria-label={l.navigateBack}
                        />
                    </Tooltip>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            color: 'var(--cratis-text-color-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        {breadcrumbItems.map((item, index) => (
                            <span key={index}>
                                {index > 0 && <span className='cratis:mx-2'>&gt;</span>}
                                <button
                                    type='button'
                                    onClick={() => navigateToBreadcrumb(index)}
                                    aria-current={
                                        index === breadcrumbItems.length - 1
                                            ? 'location'
                                            : undefined
                                    }
                                    style={{
                                        padding: 0,
                                        border: 0,
                                        background: 'transparent',
                                        color: 'inherit',
                                        font: 'inherit',
                                        cursor: 'pointer',
                                        textDecoration:
                                            index < breadcrumbItems.length - 1
                                                ? 'underline'
                                                : 'none',
                                    }}
                                >
                                    {item.name}
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
                {currentDescription && (
                    <div
                        style={{
                            fontSize: '0.875rem',
                            color: 'var(--cratis-text-color-secondary)',
                            marginTop: '0.5rem',
                            marginLeft: '2.5rem',
                            fontStyle: 'italic',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <faIcons.FaCircleInfo />
                        <span>{currentDescription}</span>
                    </div>
                )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                <DataTableCore<JsonSchemaProperty>
                    key={`${isEditMode}-${currentPath.join('/')}`}
                    data={properties}
                    dataKey='id'
                    emptyMessage={l.emptyMessage}
                    rowClassName={(rowData) => {
                        if (
                            !isEditMode &&
                            (rowData.type === 'object' ||
                                (rowData.type === 'array' &&
                                    rowData.items?.type === 'object'))
                        ) {
                            return 'cratis-schema-editor-navigable-row';
                        }
                        return '';
                    }}
                    onRowClick={(e) => {
                        if (!isEditMode) {
                            const rowData = e.data;
                            if (rowData.name) {
                                if (rowData.type === 'object') {
                                    navigateToProperty(rowData.name);
                                } else if (
                                    rowData.type === 'array' &&
                                    rowData.items?.type === 'object'
                                ) {
                                    navigateToArrayItems(rowData.name);
                                }
                            }
                        }
                    }}
                    pt={{
                        root: { style: { border: 'none' } },
                        body: {
                            style: {
                                borderTop: '1px solid var(--cratis-surface-border)',
                            },
                        },
                    }}
                >
                    <Column
                        field='name'
                        header='Property'
                        body={(rowData: JsonSchemaProperty) => (
                            <NameCell
                                rowData={rowData}
                                isEditMode={isEditMode}
                                onUpdate={updateProperty}
                                validationError={validationErrors[rowData.id!]}
                                propertyNameLabel={l.propertyName}
                            />
                        )}
                        style={{ width: '30%' }}
                    />
                    <Column
                        header='Type'
                        body={(rowData: JsonSchemaProperty) => (
                            <TypeCell
                                rowData={rowData}
                                isEditMode={isEditMode}
                                typeFormats={typeFormats}
                                onUpdateProperty={updateProperty}
                                onUpdateArrayItemType={updateArrayItemType}
                                onNavigateToProperty={navigateToProperty}
                                onNavigateToArrayItems={navigateToArrayItems}
                                onRemoveProperty={removeProperty}
                                labels={l}
                            />
                        )}
                        style={{ width: '70%' }}
                    />
                </DataTableCore>
            </div>
        </div>
    );
};
