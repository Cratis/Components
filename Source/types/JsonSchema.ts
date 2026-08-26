// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A JSON Schema document or fragment shape.
 * Represents a reusable schema definition consumed by {@link SchemaEditor} and {@link ObjectContentEditor}.
 */
export interface JsonSchema {
    /** Human-readable title for this schema. */
    title?: string;
    /** Name of the schema or type being defined. */
    name?: string;
    /** Unique identifier URI for this schema (e.g. "https://example.invalid/schemas/person.json"). */
    $id?: string;
    /** Reference to another schema definition (URI fragment or external reference). */
    $ref?: string;
    /** JSON Schema type ("string", "number", "integer", "boolean", "object", "array", "null"). */
    type?: string;
    /** Format hint for the type (e.g. "date-time", "guid", "email"). */
    format?: string;
    /** Human-readable description of this schema. */
    description?: string;
    /** Object property definitions (when `type` is "object"). */
    properties?: Record<string, JsonSchemaProperty>;
    /** Array item schema (when `type` is "array"). */
    items?: JsonSchema;
    /** List of required property names (when `type` is "object"). */
    required?: string[];
    /** Named schema definitions reusable via `$ref`. */
    definitions?: Record<string, JsonSchema>;
}

/**
 * A property definition within a JSON Schema object.
 * Describes one field's type, format, nested structure, and validation constraints.
 */
export interface JsonSchemaProperty {
    /** Unique identifier for this property. */
    id?: string;
    /** Property name (key in the parent object). */
    name?: string;
    /** JSON Schema type ("string", "number", "integer", "boolean", "object", "array", "null"). */
    type?: string;
    /** Format hint for the type (e.g. "date-time", "guid", "email"). */
    format?: string;
    /** Human-readable description of this property. */
    description?: string;
    /** Array item schema (when `type` is "array"). */
    items?: JsonSchema;
    /** Nested object property definitions (when `type` is "object"). */
    properties?: Record<string, JsonSchemaProperty>;
    /** Whether this property is required in its parent object. */
    required?: boolean;
    /** Reference to another schema definition (URI fragment or external reference). */
    $ref?: string;
}

/**
 * A breadcrumb or navigation-path entry representing one step in a navigable hierarchy.
 * Used by {@link SchemaEditor}, {@link ObjectContentEditor}, and {@link ObjectNavigationalBar}
 * to show the current location within a nested JSON schema or object structure.
 */
export interface NavigationItem {
    /** User-facing name of this navigation step (e.g. a property name or "items"). */
    name: string;
    /** Ordered list of property keys from the root to this step (e.g. ["address", "street"]). */
    path: string[];
}

/**
 * A recursive JSON value type: primitive, array, or object.
 * Represents any valid JSON structure (string | number | boolean | null | Json[] | { [key: string]: Json }).
 */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
