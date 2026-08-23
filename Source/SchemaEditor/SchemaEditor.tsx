// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../Common/Button';
import { DataTableCore } from '../DataTables/DataTableCore';
import { Column } from '../DataTables/Column';
import { ActionMenubar, type ActionMenuItem } from '../Common/ActionMenubar';
import { Tooltip } from '../Common/Tooltip';
import * as faIcons from 'react-icons/fa6';
import { NameCell } from './NameCell';
import { TypeCell } from './TypeCell';
import { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import { TypeFormat, DEFAULT_TYPE_FORMATS } from '../types/TypeFormat';
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
    /** Accessible name for the "remove property" button. */
    deleteProperty: string;
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
    deleteProperty: 'Delete property',
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

    /** Invoked with the updated schema after any structural change. */
    onChange?: (schema: JsonSchema) => void;

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
 * The editor composes a Cratis data table, action toolbar, and form
 * widgets internally; for restyling, use a global `pt` preset on
 * `CratisComponentsProvider`.
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
    const l = { ...defaultSchemaEditorLabels, ...labels };
    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [properties, setProperties] = useState<JsonSchemaProperty[]>([]);
    const [currentSchema, setCurrentSchema] = useState<JsonSchema>(schema);
    const [isEditMode, setIsEditMode] = useState(editMode ?? false);
    const [initialSchema, setInitialSchema] = useState<JsonSchema>(schema);
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
                if (!prop.name) return;
                const error = validatePropertyName(prop.name, prop.id!, properties);
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
        setCurrentSchema(schema);
        setInitialSchema(JSON.parse(JSON.stringify(schema)));
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
                    required:
                        (currentSchema.required as string[] | undefined)?.includes(
                            name,
                        ) || false,
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
            const newSchema = JSON.parse(JSON.stringify(currentSchema));

            if (path.length === 0) {
                const updated = updater(newSchema);
                setCurrentSchema(updated);
                onChange?.(updated);
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
                    targetSchema = targetSchema.properties[segment];
                }
            }

            const lastSegment = path[path.length - 1];
            if (targetSchema.type === 'array' && lastSegment === '$items') {
                targetSchema.items = updater(targetSchema.items || {});
            } else {
                if (!targetSchema.properties) {
                    targetSchema.properties = {};
                }
                targetSchema.properties[lastSegment] = updater(
                    targetSchema.properties[lastSegment] || {},
                );
            }

            setCurrentSchema(newSchema);
            onChange?.(newSchema);
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
                return { ...schema, properties: newProps };
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

                if (field === 'name') {
                    if (value !== oldName && !newProps[value as string]) {
                        newProps[value as string] = prop;
                        delete newProps[oldName];
                    }
                } else if (field === 'type') {
                    prop.type = value as string;
                    if (value === 'array') {
                        prop.items = { type: 'string' };
                        delete prop.format;
                    } else if (value === 'object') {
                        prop.properties = {};
                        delete prop.format;
                        delete prop.items;
                    } else {
                        delete prop.items;
                        delete prop.properties;
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

                return { ...schema, properties: newProps };
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
        onSave?.();
        setIsEditMode(false);
    }, [onSave]);

    const handleCancel = useCallback(() => {
        setCurrentSchema(JSON.parse(JSON.stringify(initialSchema)));
        onChange?.(JSON.parse(JSON.stringify(initialSchema)));
        setIsEditMode(false);
        onCancel?.();
    }, [initialSchema, onChange, onCancel]);

    const handleEdit = useCallback(() => {
        setInitialSchema(JSON.parse(JSON.stringify(currentSchema)));
        setIsEditMode(true);
    }, [currentSchema]);

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

    const hasValidationErrors = Object.keys(validationErrors).length > 0;

    const menuItems = useMemo<ActionMenuItem[]>(
        () => [
            ...(!isEditMode
                ? [
                      {
                          label: l.edit,
                          icon: <faIcons.FaPencil className='mr-2' />,
                          command: canEdit ? handleEdit : undefined,
                          className: !canEdit ? 'edit-disabled-with-reason' : undefined,
                          template:
                              !canEdit && canNotEditReason
                                  ? (item: ActionMenuItem) => (
                                        <Tooltip
                                            content={canNotEditReason}
                                            position='bottom'
                                        >
                                            <div
                                                style={{
                                                    cursor: 'not-allowed',
                                                    opacity: 0.6,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '0.5rem 0.75rem',
                                                }}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </div>
                                        </Tooltip>
                                    )
                                  : undefined,
                      },
                  ]
                : []),
            ...(isEditMode
                ? [
                      ...(!saveDisabled
                          ? [
                                {
                                    label: l.save,
                                    icon: <faIcons.FaCheck className='mr-2' />,
                                    command: hasValidationErrors ? undefined : handleSave,
                                    disabled: hasValidationErrors,
                                },
                            ]
                          : []),
                      ...(!cancelDisabled
                          ? [
                                {
                                    label: l.cancel,
                                    icon: <faIcons.FaXmark className='mr-2' />,
                                    command: handleCancel,
                                },
                            ]
                          : []),
                      {
                          label: l.addProperty,
                          icon: <faIcons.FaPlus className='mr-2' />,
                          command: addProperty,
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
            saveDisabled,
            cancelDisabled,
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
            <div className='px-4 py-4'>
                <div className='schema-editor-menubar'>
                    <ActionMenubar aria-label={l.actions} model={menuItems} />
                </div>
            </div>

            <div className='px-4 py-2 cratis-schema-editor-bottom-border'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tooltip content='Navigate back' position='top'>
                        <Button
                            text
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
                                {index > 0 && <span className='mx-2'>&gt;</span>}
                                <span
                                    onClick={() => navigateToBreadcrumb(index)}
                                    style={{
                                        cursor: 'pointer',
                                        textDecoration:
                                            index < breadcrumbItems.length - 1
                                                ? 'underline'
                                                : 'none',
                                    }}
                                >
                                    {item.name}
                                </span>
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
