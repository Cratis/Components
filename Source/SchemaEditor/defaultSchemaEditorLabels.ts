// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SchemaEditorLabels } from './SchemaEditorLabels';

/** The English strings the {@link SchemaEditor} falls back to. */
export const defaultSchemaEditorLabels: Required<SchemaEditorLabels> = {
    schema: 'Schema properties',
    noProperties: 'No properties defined',
    addProperty: 'Add property',
    addPropertyTo: (propertyName) => `Add property to ${propertyName}`,
    nestedProperties: (propertyName) => `Properties of ${propertyName}`,
    propertyName: (propertyName) => `Name of ${propertyName}`,
    renameHint: 'Double-click or press F2 to rename',
    deleteProperty: (propertyName) => `Delete ${propertyName}`,
    changeType: (propertyName, typeName) => `Change type of ${propertyName}, currently ${typeName}`,
    propertyTypes: 'Property types',
    concepts: 'Concepts',
    required: 'Required',
    requiredProperty: (propertyName) => `Required in schema: ${propertyName}`,
    requiredHelp: 'The property must be present in the object. An empty value still counts as present.',
    keyProperty: (propertyName) => `Use ${propertyName} as the key property`,
    setAsKey: 'Use as the key that identifies the object',
    isKey: 'This is the key that identifies the object. Select it again to clear it.',
    protectedProperty: 'This property cannot be renamed or removed.',
    nameRequired: 'Enter a name.',
    nameReserved: (name) => `${name} is reserved and cannot be used as a name.`,
    nameDuplicate: (name) => `Another property is already named ${name}.`,
    typeString: 'Text',
    typeNumber: 'Number',
    typeBoolean: 'Yes or no',
    typeDate: 'Date',
    typeTime: 'Time',
    typeStringArray: 'List of text',
    typeNumberArray: 'List of numbers',
    typeObject: 'Object',
    typeObjectArray: 'List of objects',
};
