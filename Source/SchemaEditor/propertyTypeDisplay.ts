// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyType } from './PropertyType';
import type { SchemaEditorLabels } from './SchemaEditorLabels';

/** The types the menu offers first, in order. Concepts follow them. */
export const primitivePropertyTypes: readonly PropertyType[] = [
    PropertyType.String,
    PropertyType.Number,
    PropertyType.Boolean,
    PropertyType.Date,
    PropertyType.Time,
];

/** The types the menu offers after the concepts, in order. */
export const compositePropertyTypes: readonly PropertyType[] = [
    PropertyType.StringArray,
    PropertyType.NumberArray,
    PropertyType.Object,
    PropertyType.ObjectArray,
];

/** Short text shown in a type badge; decorative, because the badge also carries the type's name. */
export const propertyTypeGlyph: Record<PropertyType, string> = {
    [PropertyType.String]: 'Aa',
    [PropertyType.Number]: '123',
    [PropertyType.Boolean]: 'T/F',
    [PropertyType.Date]: 'Date',
    [PropertyType.Time]: 'Time',
    [PropertyType.Object]: '{ }',
    [PropertyType.StringArray]: '[Aa]',
    [PropertyType.NumberArray]: '[123]',
    [PropertyType.ObjectArray]: '[{ }]',
};

/**
 * The display name of a property type.
 * @param type The type.
 * @param labels The resolved labels.
 * @returns The localized name.
 */
export function propertyTypeName(type: PropertyType, labels: Required<SchemaEditorLabels>): string {
    switch (type) {
        case PropertyType.Number: return labels.typeNumber;
        case PropertyType.Boolean: return labels.typeBoolean;
        case PropertyType.Date: return labels.typeDate;
        case PropertyType.Time: return labels.typeTime;
        case PropertyType.StringArray: return labels.typeStringArray;
        case PropertyType.NumberArray: return labels.typeNumberArray;
        case PropertyType.Object: return labels.typeObject;
        case PropertyType.ObjectArray: return labels.typeObjectArray;
        default: return labels.typeString;
    }
}

/**
 * Whether values of the type carry nested properties.
 * @param type The type.
 * @returns `true` for objects and lists of objects.
 */
export function hasNestedProperties(type: PropertyType): boolean {
    return type === PropertyType.Object || type === PropertyType.ObjectArray;
}
