// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JsonSchema, JsonSchemaProperty } from '../../types/JsonSchema';
import type { Property } from './Property';
import { PropertyType } from './PropertyType';
import { conceptPropertyName, uniquePropertyName } from './propertyNaming';
import { findPropertyById } from './propertyTree';
import { keywordsAfterTypeChange, propertyTypeFamily } from './keywordApplicability';
import {
    copySchemaKeywordOrder,
    itemSchemaKeywordOrder,
    schemaKeywordOrder,
    schemaOriginalShape,
    schemaRequiredOrder,
    type SchemaOrderedProperty,
} from './SchemaOrderedProperty';
import { isNode, readOriginalShape, readRequiredOrder, restoreOriginalShape } from './originalShape';
import { schemaPropertyType } from './schemaPropertyType';
import { standardItemKeywords, standardPropertyKeywords } from './standardKeywords';
import { requiredInOriginalOrder, schemaInOriginalOrder } from './schemaInOriginalOrder';

/**
 * The JSON Schema keyword carrying the concept a property is typed as. It annotates the primitive node the
 * concept wraps rather than replacing it, so anything that does not know about concepts — code generation,
 * an export, another tool — still reads a valid schema of the underlying primitive.
 */
export const CONCEPT_KEYWORD = 'x-concept';

/**
 * The JSON Schema keyword marking the property that identifies its parent object. Written as `true` on the
 * property; at most one property of an object carries it.
 */
export const KEY_KEYWORD = 'x-key';

/** The JSON Schema keyword marking a value generated when the command runs rather than entered. */
export const GENERATED_KEYWORD = 'x-generated';

type SchemaNode = Record<string, unknown>;

const isComplex = (type: PropertyType): boolean => type === PropertyType.Object || type === PropertyType.ObjectArray;

const identifier = (): string => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

// ── JsonSchema → Property[] ─────────────────────────────────────────

function vendorKeywords(node: SchemaNode, isProperty: boolean): Readonly<Record<string, unknown>> | undefined {
    const entries = Object.entries(node).filter(([name, value]) => {
        if (!name.startsWith('x-')) return false;
        if (!isProperty) return true;
        return name !== CONCEPT_KEYWORD && name !== KEY_KEYWORD && !(name === GENERATED_KEYWORD && value === true);
    });
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function readItemKeywords(node: SchemaNode, type: PropertyType): Partial<SchemaOrderedProperty> {
    if (node.type !== 'array' || !isNode(node.items)) return {};
    const items = node.items;
    const keywords = vendorKeywords(items, false);
    const standard = standardItemKeywords(items, type);
    return {
        [itemSchemaKeywordOrder]: Object.keys(items),
        ...(keywords ? { itemVendorKeywords: keywords } : {}),
        ...(standard ? { itemSchemaKeywords: standard } : {}),
    };
}

function requiredOrder(node: SchemaNode, type: PropertyType): Partial<SchemaOrderedProperty> {
    const order = readRequiredOrder(node, type);
    return order ? { [schemaRequiredOrder]: order } : {};
}

function readFlags(node: SchemaNode, type: PropertyType, isRequired: boolean): Partial<SchemaOrderedProperty> {
    const keywords = vendorKeywords(node, true);
    const standard = standardPropertyKeywords(node, type);
    return {
        [schemaKeywordOrder]: Object.keys(node),
        [schemaOriginalShape]: readOriginalShape(node, type),
        ...requiredOrder(node, type),
        ...readItemKeywords(node, type),
        ...(keywords ? { vendorKeywords: keywords } : {}),
        ...(standard ? { schemaKeywords: standard } : {}),
        ...(node[GENERATED_KEYWORD] === true ? { isGenerated: true } : {}),
        ...(isRequired ? { isRequired: true } : {}),
        ...(node[KEY_KEYWORD] === true ? { isKey: true } : {}),
    };
}

function schemaPropertyToProperty(name: string, value: JsonSchemaProperty, required: ReadonlySet<string>): Property {
    const node = value as unknown as SchemaNode;
    const type = schemaPropertyType(node);
    const concept = node[CONCEPT_KEYWORD];
    const flags = readFlags(node, type, required.has(name));

    const container = (type === PropertyType.Object ? node : type === PropertyType.ObjectArray ? node.items : undefined) as
        | { properties?: Record<string, JsonSchemaProperty>; required?: string[] }
        | undefined;

    if (container?.properties) {
        const childRequired = new Set(container.required ?? []);
        return copySchemaKeywordOrder(flags, {
            id: identifier(),
            name,
            type,
            ...flags,
            children: Object.entries(container.properties).map(([childName, child]) =>
                schemaPropertyToProperty(childName, child, childRequired)),
        });
    }

    return copySchemaKeywordOrder(flags, {
        id: identifier(),
        name,
        type,
        ...flags,
        ...(typeof concept === 'string' && concept.length > 0 ? { concept } : {}),
    });
}

/**
 * Converts a JSON Schema object into a property tree. Generates a new id for every property.
 * @param schema The schema to read; `undefined` and schemas without properties give an empty tree.
 * @returns The root properties.
 */
export function jsonSchemaToProperties(schema: JsonSchema | undefined): Property[] {
    if (!schema?.properties) return [];
    const required = new Set(schema.required ?? []);
    return Object.entries(schema.properties).map(([name, value]) => schemaPropertyToProperty(name, value, required));
}

// ── Property[] → JsonSchema ─────────────────────────────────────────

function itemSchema(property: Property, type: string, extra: SchemaNode = {}): SchemaNode {
    return { ...property.itemSchemaKeywords, type, ...extra, ...property.itemVendorKeywords };
}

function primitiveSchema(property: Property): SchemaNode {
    switch (property.type) {
        case PropertyType.Number:
            return { type: 'number' };
        case PropertyType.Boolean:
            return { type: 'boolean' };
        case PropertyType.Date:
            return { type: 'string', format: 'date' };
        case PropertyType.Time:
            return { type: 'string', format: 'time' };
        case PropertyType.UniqueIdentifier:
            return { type: 'string', format: 'uuid' };
        case PropertyType.Object:
            return { type: 'object', ...objectSchema(property.children ?? [], (property as SchemaOrderedProperty)[schemaRequiredOrder]) };
        case PropertyType.StringArray:
            return { type: 'array', items: itemSchema(property, 'string') };
        case PropertyType.NumberArray:
            return { type: 'array', items: itemSchema(property, 'number') };
        case PropertyType.ObjectArray:
            return { type: 'array', items: itemSchema(property, 'object', objectSchema(property.children ?? [], (property as SchemaOrderedProperty)[schemaRequiredOrder])) };
        default:
            return { type: 'string' };
    }
}

function orderedPrimitiveSchema(property: SchemaOrderedProperty): SchemaNode {
    const schema = restoreOriginalShape({ ...property.schemaKeywords, ...primitiveSchema(property) }, property);
    if (isNode(schema.items)) schema.items = schemaInOriginalOrder(schema.items as SchemaNode, property[itemSchemaKeywordOrder]);
    return schema;
}

function propertyAnnotations(property: Property): SchemaNode {
    return {
        ...property.vendorKeywords,
        ...(property.isGenerated === true ? { [GENERATED_KEYWORD]: true } : {}),
        ...(property.concept ? { [CONCEPT_KEYWORD]: property.concept } : {}),
        ...(property.isKey === true ? { [KEY_KEYWORD]: true } : {}),
    };
}

function propertySchema(property: SchemaOrderedProperty): JsonSchemaProperty {
    return schemaInOriginalOrder({ ...orderedPrimitiveSchema(property), ...propertyAnnotations(property) }, property[schemaKeywordOrder]) as unknown as JsonSchemaProperty;
}

function objectSchema(properties: Property[], requiredOrder?: readonly string[]): { properties: Record<string, JsonSchemaProperty>; required?: string[] } {
    const schemaProperties: Record<string, JsonSchemaProperty> = {};
    for (const property of properties) {
        schemaProperties[property.name] = propertySchema(property);
    }
    const required = requiredInOriginalOrder(properties.filter(property => property.isRequired === true).map(property => property.name), requiredOrder);
    return { properties: schemaProperties, ...(required.length > 0 ? { required } : {}) };
}

/**
 * Converts a property tree into a JSON Schema object. Empty `required` lists are omitted, and a property
 * typed as a concept or marked as the key carries the `x-concept` and `x-key` keywords. Vendor keywords and the
 * standard keywords the editor does not model are preserved on properties and array items; generated values carry `x-generated: true`.
 * @param properties The root properties.
 * @param base The incoming schema. Root keys other than type, properties and required are preserved.
 * @returns The schema.
 */
export function propertiesToJsonSchema(properties: Property[], base: JsonSchema = {}): JsonSchema {
    const root = Object.fromEntries(Object.entries(base).filter(([name]) => !['properties', 'required'].includes(name)));
    return schemaInOriginalOrder({ ...root, type: 'object', ...objectSchema(properties, base.required) }, Object.keys(base)) as JsonSchema;
}

// ── Pure tree edits ─────────────────────────────────────────────────

function newProperty(siblings: Property[], type: PropertyType, existingCount: number, concept?: string): Property {
    const base = isComplex(type) ? 'nested' : 'property';
    const name = concept ? uniquePropertyName(siblings, conceptPropertyName(concept)) : `${base}${existingCount + 1}`;

    return {
        id: identifier(),
        name,
        type,
        ...(concept ? { concept } : {}),
        ...(isComplex(type) ? { children: [] } : {}),
    };
}

/**
 * Appends a property to the root.
 * @param properties The root properties.
 * @param type The type of the new property.
 * @param existingCount The number of properties already in the tree, used to generate the default name; see {@link totalPropertyCount}.
 * @param concept The concept the property is typed as. When given the property is named after it.
 * @returns The new tree.
 */
export function addProperty(properties: Property[], type: PropertyType, existingCount: number, concept?: string): Property[] {
    return [...properties, newProperty(properties, type, existingCount, concept)];
}

/**
 * Appends a property to a nested object or object list.
 * @param properties The root properties.
 * @param parentId The id of the parent property.
 * @param type The type of the new property.
 * @param existingCount The number of properties already in the tree, used to generate the default name.
 * @param concept The concept the property is typed as.
 * @returns The new tree.
 */
export function addChildProperty(
    properties: Property[],
    parentId: string,
    type: PropertyType,
    existingCount: number,
    concept?: string,
): Property[] {
    const siblings = findPropertyById(properties, parentId)?.children ?? [];
    const child = newProperty(siblings, type, existingCount, concept);
    const insert = (level: Property[]): Property[] => level.map(property => {
        if (property.id === parentId) return copySchemaKeywordOrder(property, { ...property, children: [...(property.children ?? []), child] });
        return property.children ? copySchemaKeywordOrder(property, { ...property, children: insert(property.children) }) : property;
    });
    return insert(properties);
}

/**
 * Removes a property, and everything nested under it.
 * @param properties The root properties.
 * @param targetId The id of the property to remove.
 * @returns The new tree.
 */
export function removeProperty(properties: Property[], targetId: string): Property[] {
    return properties
        .filter(property => property.id !== targetId)
        .map(property => property.children ? copySchemaKeywordOrder(property, { ...property, children: removeProperty(property.children, targetId) }) : property);
}

function updateProperty(properties: Property[], targetId: string, update: (property: Property) => Property): Property[] {
    return properties.map(property => {
        if (property.id === targetId) return update(property);
        return property.children ? copySchemaKeywordOrder(property, { ...property, children: updateProperty(property.children, targetId, update) }) : property;
    });
}

/**
 * Renames a property. Its requiredness travels with it, because both are stored against the property.
 * @param properties The root properties.
 * @param targetId The id of the property to rename.
 * @param newName The new name.
 * @returns The new tree.
 */
export function renameProperty(properties: Property[], targetId: string, newName: string): Property[] {
    return updateProperty(properties, targetId, property => copySchemaKeywordOrder(property, { ...property, name: newName }));
}

function retypedProperty(property: Property, newType: PropertyType, concept?: string): Property {
    const next: SchemaOrderedProperty = copySchemaKeywordOrder(property, {
        ...property,
        type: newType,
        concept,
        children: isComplex(newType) ? (property.children ?? []) : undefined,
    });
    if (property.type !== newType) {
        const kept = keywordsAfterTypeChange(property.schemaKeywords ?? {}, propertyTypeFamily(property.type), propertyTypeFamily(newType));
        delete next.schemaKeywords;
        if (Object.keys(kept).length > 0) next.schemaKeywords = kept;
        delete next.itemVendorKeywords;
        delete next.itemSchemaKeywords;
        delete next[itemSchemaKeywordOrder];
        delete next[schemaOriginalShape];
    }
    return next;
}

/**
 * Changes the type of a property. Choosing a plain primitive drops the concept; choosing an object or
 * object list keeps the children, and any other type drops them. A different type keeps the annotations and the
 * constraints of the same keyword family, and drops value keywords, the original type and format, item metadata
 * and every other standard keyword that no longer applies. The same type keeps everything.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @param newType The new type.
 * @param concept The concept the property is now typed as, if any.
 * @returns The new tree.
 */
export function changePropertyType(properties: Property[], targetId: string, newType: PropertyType, concept?: string): Property[] {
    return updateProperty(properties, targetId, property => retypedProperty(property, newType, concept));
}

/**
 * Flips whether a property is required.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @returns The new tree.
 */
export function toggleRequiredProperty(properties: Property[], targetId: string): Property[] {
    return updateProperty(properties, targetId, property => copySchemaKeywordOrder(property, { ...property, isRequired: !property.isRequired || undefined }));
}

/**
 * Sets whether a property is required. Requiring a nested property does not require its parent.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @param isRequired Whether the property must be present.
 * @returns The new tree.
 */
export function setRequiredProperty(properties: Property[], targetId: string, isRequired: boolean): Property[] {
    return updateProperty(properties, targetId, property => copySchemaKeywordOrder(property, { ...property, isRequired }));
}

/**
 * Sets whether a property's value is generated. An explicit edit replaces any non-true x-generated value.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @param isGenerated Whether the value is generated.
 * @returns The new tree.
 */
export function setGeneratedProperty(properties: Property[], targetId: string, isGenerated: boolean): Property[] {
    return updateProperty(properties, targetId, property => {
        const keywords = Object.fromEntries(Object.entries(property.vendorKeywords ?? {}).filter(([name]) => name !== GENERATED_KEYWORD));
        const next = { ...property };
        delete next.isGenerated;
        delete next.vendorKeywords;
        return copySchemaKeywordOrder(property, { ...next, ...(isGenerated ? { isGenerated: true } : {}), ...(Object.keys(keywords).length > 0 ? { vendorKeywords: keywords } : {}) });
    });
}

/**
 * Makes a property the key of its parent object, moving the key when a sibling held it. Choosing the
 * property that already is the key clears it, so an object can also have no key.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @returns The new tree.
 */
export function setKeyProperty(properties: Property[], targetId: string): Property[] {
    const target = properties.find(property => property.id === targetId);
    return properties.map(property => copySchemaKeywordOrder(property, {
        ...property,
        ...(target ? { isKey: property.id === targetId && target.isKey !== true ? true : undefined } : {}),
        ...(property.children ? { children: setKeyProperty(property.children, targetId) } : {}),
    }));
}
