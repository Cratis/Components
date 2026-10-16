// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyType } from './PropertyType';

type SchemaNode = Record<string, unknown>;

/**
 * The property type a schema node reads as. An unknown or missing `type` reads as text, and a list whose
 * items are not numbers or objects reads as a list of text.
 * @param value The property schema node.
 * @returns The property type.
 */
export function schemaPropertyType(value: SchemaNode): PropertyType {
    const items = value.items as { type?: string } | undefined;

    switch (value.type) {
        case 'string':
            if (value.format === 'date') return PropertyType.Date;
            if (value.format === 'time') return PropertyType.Time;
            return PropertyType.String;
        case 'number':
        case 'integer':
            return PropertyType.Number;
        case 'boolean':
            return PropertyType.Boolean;
        case 'object':
            return PropertyType.Object;
        case 'array':
            if (items?.type === 'number' || items?.type === 'integer') return PropertyType.NumberArray;
            if (items?.type === 'object') return PropertyType.ObjectArray;
            return PropertyType.StringArray;
        default:
            return PropertyType.String;
    }
}
