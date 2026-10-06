// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext, type ReactNode } from 'react';
import type { Property } from './Property';
import type { PropertyConcept } from './PropertyConcept';
import type { PropertyType } from './PropertyType';
import type { SchemaEditorLabels } from './SchemaEditorLabels';
import type { SchemaEditorParts } from './SchemaEditorParts';
import type { SchemaPropertyContext } from './SchemaPropertyContext';
import type { SchemaPropertyRowState } from './SchemaPropertyRowState';

/** The edits the editor can currently perform. An edit that is `undefined` is not offered. */
export interface SchemaEditorOperations {
    addChild?: (parentId: string, type: PropertyType, concept?: string) => void;
    remove?: (propertyId: string) => void;
    rename?: (propertyId: string, name: string) => void;
    changeType?: (propertyId: string, type: PropertyType, concept?: string) => void;
    setKey?: (propertyId: string) => void;
    setRequired?: (propertyId: string, isRequired: boolean) => void;
}

/** Everything the rows of an editor share. Internal: hosts configure the editor through its props. */
export interface SchemaEditorContextValue {
    labels: Required<SchemaEditorLabels>;
    parts: SchemaEditorParts | undefined;
    properties: Property[];
    concepts: PropertyConcept[];
    readOnly: boolean;
    operations: SchemaEditorOperations;
    selectedPropertyId: string | null | undefined;
    onPropertyClick: ((propertyId: string) => void) | undefined;
    isKeyAllowed: (property: Property, context: SchemaPropertyContext) => boolean;
    isRequiredAllowed: boolean;
    isProtected: (property: Property) => boolean;
    validateName: ((name: string, property: Property, siblings: Property[]) => string | undefined) | undefined;
    getRowState: ((property: Property, context: SchemaPropertyContext) => SchemaPropertyRowState | undefined) | undefined;
    renderLeading: ((property: Property, context: SchemaPropertyContext) => ReactNode) | undefined;
    renderAccessory: ((property: Property, context: SchemaPropertyContext) => ReactNode) | undefined;
    renderDetails: ((property: Property, context: SchemaPropertyContext) => ReactNode) | undefined;
}

/** Carries the editor's shared configuration to its rows. */
export const SchemaEditorContext = createContext<SchemaEditorContextValue | undefined>(undefined);

/** Reads the editor's shared configuration. Rows only render inside an editor. */
export const useSchemaEditorContext = (): SchemaEditorContextValue => {
    const value = useContext(SchemaEditorContext);
    if (!value) throw new Error('A schema property row must be rendered inside a SchemaEditor.');
    return value;
};
