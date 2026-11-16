// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import { dropInapplicableKeywords } from './schemaHelpers';
import type { Property } from './Tree/Property';
import { jsonSchemaToProperties, KEY_KEYWORD } from './Tree/schemaConversion';

type PropertyNode = JsonSchemaProperty & Record<string, unknown>;

/** Adds a new string property with the first free `newProperty` name. */
export const addPropertyTo = (schema: JsonSchema): JsonSchema => {
    const properties = { ...(schema.properties || {}) };
    let name = 'newProperty';
    let counter = 1;
    while (properties[name]) {
        name = `newProperty${counter++}`;
    }
    properties[name] = { type: 'string' };
    return { ...schema, properties };
};

/** Removes a property and drops it from the schema's own `required` array. */
export const removePropertyFrom = (schema: JsonSchema, propertyName: string): JsonSchema => {
    const properties = { ...(schema.properties || {}) };
    delete properties[propertyName];

    // Deleting a property must also drop it from this schema's own
    // `required` array, or the array keeps naming a property that no
    // longer exists in `properties`.
    const updated: JsonSchema = { ...schema, properties };
    if (schema.required?.includes(propertyName)) {
        updated.required = schema.required.filter((name) => name !== propertyName);
    }
    return updated;
};

/** Marks a property required or optional, removing the `required` array when it ends up empty. */
export const setRequiredIn = (schema: JsonSchema, propertyName: string, isRequired: boolean): JsonSchema => {
    const others = (schema.required ?? []).filter((name) => name !== propertyName);
    const required = isRequired ? [...others, propertyName] : others;
    const updated: JsonSchema = { ...schema };
    if (required.length > 0) {
        updated.required = required;
    } else {
        delete updated.required;
    }
    return updated;
};

/** Makes the named property the key, clearing the key marker from every other property. */
export const setKeyIn = (schema: JsonSchema, propertyName: string): JsonSchema => {
    const properties: Record<string, JsonSchemaProperty> = {};
    for (const [name, property] of Object.entries(schema.properties || {})) {
        const { [KEY_KEYWORD]: previousKey, ...rest } = property as PropertyNode;
        const makeKey = name === propertyName && previousKey !== true;
        properties[name] = (makeKey ? { ...rest, [KEY_KEYWORD]: true } : rest) as JsonSchemaProperty;
    }
    return { ...schema, properties };
};

/** Sets the item type of an array property, giving object and array items their own shape. */
export const setArrayItemType = (schema: JsonSchema, propertyName: string, itemType: string): JsonSchema => {
    const properties = { ...(schema.properties || {}) };
    const property = { ...(properties[propertyName] || {}) };

    if (itemType === 'object') {
        property.items = { type: 'object', properties: {} };
    } else if (itemType === 'array') {
        property.items = { type: 'array', items: { type: 'string' } };
    } else {
        property.items = { type: itemType };
    }

    properties[propertyName] = property;
    return { ...schema, properties };
};

/** One edit of a property's name, type or format. */
export interface PropertyEdit {
    field: keyof JsonSchemaProperty;
    value: unknown;
    additionalUpdates?: Partial<JsonSchemaProperty>;
}

/** The outcome of an edit: the new schema and, for a rename, the renamed property. */
export interface PropertyEditResult {
    schema: JsonSchema;
    renamed?: Property;
}

// Only an "object" property has a meaningful `required` array of its own; a fresh `properties`
// or an array's items make any prior one stale.
const reshapeForType = (property: JsonSchemaProperty, type: unknown) => {
    if (type === 'array') {
        property.items = { type: 'string' };
        delete property.format;
    } else if (type === 'object') {
        property.properties = {};
        delete property.format;
        delete property.items;
    } else {
        delete property.items;
        delete property.properties;
    }
    delete property.required;
};

const applyFormatUpdate = (property: JsonSchemaProperty, updates: Partial<JsonSchemaProperty> | undefined) => {
    if (!updates || !('format' in updates)) return;
    if (updates.format) {
        property.format = updates.format;
    } else {
        delete property.format;
    }
};

const changeType = (property: JsonSchemaProperty, type: unknown, updates: Partial<JsonSchemaProperty> | undefined) => {
    const previousNode = { ...property } as Record<string, unknown>;
    property.type = type as string;
    // A concept belongs to the type it was chosen for; the table offers no concepts.
    delete (property as Record<string, unknown>)['x-concept'];
    reshapeForType(property, type);
    applyFormatUpdate(property, updates);
    dropInapplicableKeywords(property as Record<string, unknown>, previousNode);
};

const changeFormat = (property: JsonSchemaProperty, format: unknown) => {
    if (format && format !== 'none') {
        property.format = format as string;
    } else {
        delete property.format;
    }
};

// Renaming a required property must keep the `required` array pointing at the new name, or it goes
// stale and silently references a property that no longer exists.
const renameRequired = (required: string[] | undefined, oldName: string, newName: string) =>
    required?.includes(oldName) ? required.map((name) => (name === oldName ? newName : name)) : required;

const canRename = (properties: Record<string, JsonSchemaProperty>, oldName: string, newName: string, isLocked: boolean) =>
    !isLocked && newName !== oldName && !properties[newName];

const renameProperty = (schema: JsonSchema, oldName: string, newName: string): PropertyEditResult => {
    const property = schema.properties?.[oldName] || {};
    const properties = { ...schema.properties, [newName]: property };
    delete properties[oldName];
    return {
        schema: { ...schema, properties, required: renameRequired(schema.required, oldName, newName) },
        renamed: jsonSchemaToProperties({ properties: { [newName]: property } })[0],
    };
};

const reshapeProperty = (property: JsonSchemaProperty, { field, value, additionalUpdates }: PropertyEdit) => {
    if (field === 'type') changeType(property, value, additionalUpdates);
    if (field === 'format') changeFormat(property, value);
};

/**
 * Applies a name, type or format edit to one property of a schema.
 * @param schema The schema holding the property.
 * @param oldName The property's current name.
 * @param edit The edit to apply.
 * @param isLocked Whether the property is protected from renaming.
 * @returns The updated schema and, for a rename, the renamed property.
 */
export const editProperty = (
    schema: JsonSchema,
    oldName: string,
    edit: PropertyEdit,
    isLocked: boolean,
): PropertyEditResult => {
    const properties = { ...(schema.properties || {}) };
    if (edit.field === 'name') {
        const newName = edit.value as string;
        return canRename(properties, oldName, newName, isLocked)
            ? renameProperty(schema, oldName, newName)
            : { schema: { ...schema, properties } };
    }

    const property = { ...(properties[oldName] || {}) };
    reshapeProperty(property, edit);
    if (edit.field === 'type' || edit.field === 'format') properties[oldName] = property;
    return { schema: { ...schema, properties } };
};
