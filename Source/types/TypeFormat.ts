// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A JSON Schema type-and-format pair.
 * Maps a JSON type (e.g. "string", "integer") to an optional format specifier (e.g. "guid", "date-time").
 */
export interface TypeFormat {
    /** JSON Schema type ("string", "number", "integer", "boolean", "object", "array", "null"). */
    jsonType: string;
    /** Optional format specifier refining the type (e.g. "guid", "date-time", "int32", "double"). Empty string for no format. */
    format: string;
}

/**
 * Default JSON type-to-format mapping table.
 * This is a value contract other code can reference or extend, not just an internal default.
 * Consumed by {@link SchemaEditor} and {@link ObjectContentEditor} to populate type/format dropdowns.
 */
export const DEFAULT_TYPE_FORMATS: TypeFormat[] = [
    { jsonType: 'string', format: '' },
    { jsonType: 'string', format: 'guid' },
    { jsonType: 'string', format: 'date-time' },
    { jsonType: 'string', format: 'date' },
    { jsonType: 'string', format: 'time' },
    { jsonType: 'integer', format: '' },
    { jsonType: 'integer', format: 'int16' },
    { jsonType: 'integer', format: 'int32' },
    { jsonType: 'integer', format: 'int64' },
    { jsonType: 'number', format: '' },
    { jsonType: 'number', format: 'float' },
    { jsonType: 'number', format: 'double' },
    { jsonType: 'boolean', format: '' },
];
