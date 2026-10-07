// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { SchemaEditorLabels } from './SchemaEditorLabels';

/** Every label with its English default, so the editor never has to guard an unset one. */
export const completeSchemaEditorLabels: Required<SchemaEditorLabels> = {
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
    schema: 'Schema properties',
    addPropertyTo: (propertyName) => `Add property to ${propertyName}`,
    nestedProperties: (propertyName) => `Properties of ${propertyName}`,
    propertyNameFor: (propertyName) => `Name of ${propertyName}`,
    renameHint: 'Double-click or press F2 to rename',
    deletePropertyFor: (propertyName) => `Delete ${propertyName}`,
    changeType: (propertyName, typeName) => `Change type of ${propertyName}, currently ${typeName}`,
    propertyTypes: 'Property types',
    concepts: 'Concepts',
    noConcepts: 'No concepts defined',
    required: 'Required',
    requiredProperty: (propertyName) => `Required in schema: ${propertyName}`,
    requiredHelp: 'The property must be present in the object. An empty value still counts as present.',
    keyProperty: (propertyName) => `Use ${propertyName} as the key property`,
    setAsKey: 'Use as the key that identifies the object',
    isKey: 'This is the key that identifies the object. Select it again to clear it.',
    keyColumn: 'Key',
    requiredColumn: 'Required',
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

/**
 * English defaults for {@link SchemaEditorLabels}. The labels added for the tree layout and the capabilities are
 * optional on the type, and are present here with their English text.
 */
export const defaultSchemaEditorLabels: SchemaEditorLabels = completeSchemaEditorLabels;
