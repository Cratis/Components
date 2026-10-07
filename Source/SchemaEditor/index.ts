// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export * from './SchemaEditor';
export type { SchemaEditorLayout } from './SchemaEditorLayout';
export type { SchemaEditorParts, SchemaEditorPartAttributes, SchemaEditorMenuPartAttributes } from './Tree/SchemaEditorParts';
export type { SchemaPropertyContext } from './Tree/SchemaPropertyContext';
export type { SchemaPropertyRowState } from './Tree/SchemaPropertyRowState';
export { PropertyConceptsProvider, usePropertyConcepts } from './Tree/PropertyConceptsContext';
export type { PropertyConceptsProviderProps } from './Tree/PropertyConceptsContext';
export type { Property } from './Tree/Property';
export { PropertyType } from './Tree/PropertyType';
export type { PropertyConcept } from './Tree/PropertyConcept';
export {
    PropertyNameProblem,
    conceptPropertyName,
    findPropertyNameProblem,
    uniquePropertyName,
} from './Tree/propertyNaming';
export { findPropertyById, findPropertyByName, findSiblingProperties, totalPropertyCount } from './Tree/propertyTree';
export {
    CONCEPT_KEYWORD,
    KEY_KEYWORD,
    addChildProperty,
    addProperty,
    changePropertyType,
    jsonSchemaToProperties,
    propertiesToJsonSchema,
    removeProperty,
    renameProperty,
    setKeyProperty,
    setRequiredProperty,
    toggleRequiredProperty,
} from './Tree/schemaConversion';
export * from '../types/JsonSchema';
export * from '../types/TypeFormat';
