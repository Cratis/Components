// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext, type ReactNode } from 'react';
import type { PropertyConcept } from './PropertyConcept';

const PropertyConceptsContext = createContext<PropertyConcept[]>([]);

/** Props for the {@link PropertyConceptsProvider} component. */
export interface PropertyConceptsProviderProps {
    /** The concepts the schema editors within this scope can type a property as. */
    concepts: PropertyConcept[];

    /** The scope the concepts are available in. */
    children?: ReactNode;
}

/**
 * Makes the concepts of the surrounding scope available to every {@link SchemaEditor} rendered inside it.
 *
 * The same set of concepts usually applies to every schema in an application, and the editors sit several
 * components below whoever knows which concepts exist — so provide them once for the scope instead of
 * threading a `concepts` prop through each editor. An editor's own `concepts` prop takes precedence.
 */
export const PropertyConceptsProvider = ({ concepts, children }: PropertyConceptsProviderProps) => (
    <PropertyConceptsContext.Provider value={concepts}>{children}</PropertyConceptsContext.Provider>
);

/** The concepts available as property types in the current scope. Empty when nothing provides them. */
export const usePropertyConcepts = (): PropertyConcept[] => useContext(PropertyConceptsContext);
