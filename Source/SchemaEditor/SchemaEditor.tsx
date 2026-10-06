// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FaPlus } from 'react-icons/fa6';
import type { JsonSchema } from '../types/JsonSchema';
import type { Property } from './Property';
import type { PropertyConcept } from './PropertyConcept';
import { usePropertyConcepts } from './PropertyConceptsContext';
import { PropertyType } from './PropertyType';
import { findPropertyById } from './propertyTree';
import { PropertyTypeMenu } from './PropertyTypeMenu';
import {
    addChildProperty,
    addProperty,
    changePropertyType,
    jsonSchemaToProperties,
    propertiesToJsonSchema,
    removeProperty,
    renameProperty,
    setKeyProperty,
    setRequiredProperty,
} from './schemaConversion';
import { SchemaEditorContext, type SchemaEditorContextValue, type SchemaEditorOperations } from './SchemaEditorContext';
import type { SchemaEditorLabels } from './SchemaEditorLabels';
import type { SchemaEditorParts } from './SchemaEditorParts';
import { resolveSchemaEditorLabels } from './resolveSchemaEditorLabels';
import type { SchemaPropertyContext } from './SchemaPropertyContext';
import type { SchemaPropertyRowState } from './SchemaPropertyRowState';
import { SchemaPropertyRow } from './SchemaPropertyRow';
import { totalPropertyCount } from './propertyTree';

/** Props for the {@link SchemaEditor} component. */
export interface SchemaEditorProps {
    /**
     * The JSON Schema to edit. The editor converts it, keeps the edited property tree itself and reports every
     * edit through {@link SchemaEditorProps.onChange}. Passing the reported schema back, or the same schema
     * again, changes nothing; passing a schema that differs from both replaces the tree and its property ids.
     * Ignored when `properties` is given.
     */
    schema?: JsonSchema;

    /** Called with the complete schema after every edit. Only used when the editor owns the property tree. */
    onChange?: (schema: JsonSchema) => void;

    /** Called with the property tree after every edit, so a host can follow the ids. Only used when the editor owns the property tree. */
    onPropertiesChange?: (properties: Property[]) => void;

    /** Called after a property was removed, with the property and everything nested under it. Only used when the editor owns the property tree. */
    onPropertyRemoved?: (property: Property) => void;

    /** Called after a property was renamed, with the renamed property and the name it had. Only used when the editor owns the property tree. */
    onPropertyRenamed?: (property: Property, previousName: string) => void;

    /**
     * The property tree to show. When given, the editor is controlled: it changes nothing itself and each edit
     * is offered through the matching `onAddProperty`, `onDeleteProperty`… callback, which the host applies.
     * An edit without a callback is not offered.
     */
    properties?: Property[];

    /** Controlled mode: add a property to the root. */
    onAddProperty?: (type: PropertyType, concept?: string) => void;

    /** Controlled mode: add a property to a nested object. */
    onAddChildProperty?: (parentId: string, type: PropertyType, concept?: string) => void;

    /** Controlled mode: remove a property. */
    onDeleteProperty?: (propertyId: string) => void;

    /** Controlled mode: rename a property. The name is already checked. */
    onRenameProperty?: (propertyId: string, name: string) => void;

    /** Controlled mode: change the type of a property. */
    onChangePropertyType?: (propertyId: string, type: PropertyType, concept?: string) => void;

    /** Controlled mode: make a property the key of its object, or clear it when it already is. */
    onSetKeyProperty?: (propertyId: string) => void;

    /** Controlled mode: set whether a property must be present. */
    onSetRequiredProperty?: (propertyId: string, isRequired: boolean) => void;

    /**
     * The concepts a property can be typed as, offered after the primitive types. Takes precedence over the
     * concepts of a surrounding {@link PropertyConceptsProvider}.
     */
    concepts?: PropertyConcept[];

    /**
     * Offers the key toggle. `true` offers it on every property; a function decides per property, for example
     * `(property, context) => context.depth > 0` to leave the root properties out. Off by default.
     */
    allowKeyProperty?: boolean | ((property: Property, context: SchemaPropertyContext) => boolean);

    /** Offers the toggle for whether a property must be present (the `required` list). Off by default. */
    allowRequired?: boolean;

    /** Offers no edits at all: the tree is shown, and only selection and the host's slots remain. */
    readOnly?: boolean;

    /** Decides which properties can be neither renamed nor removed. By default none. */
    isPropertyProtected?: (property: Property) => boolean;

    /**
     * Extra check of a new name, after the editor has rejected blank, reserved and duplicate names.
     * Return the message to show, or `undefined` to accept the name.
     */
    validatePropertyName?: (name: string, property: Property, siblings: Property[]) => string | undefined;

    /** The id of the property to mark as selected. */
    selectedPropertyId?: string | null;

    /** Called when a property's row is clicked, or its name is activated from the keyboard. */
    onPropertyClick?: (propertyId: string) => void;

    /** Content above the properties, for example the title of the schema. */
    header?: ReactNode;

    /** Content beside the add button, for example further actions. */
    footer?: ReactNode;

    /** Content at the start of every row, before the name; for example a connector to drag from or onto. */
    renderPropertyLeading?: (property: Property, context: SchemaPropertyContext) => ReactNode;

    /** Content at the end of every row, before the remove button; for example a button that opens rules. */
    renderPropertyAccessory?: (property: Property, context: SchemaPropertyContext) => ReactNode;

    /** Content under every row, above its nested properties; for example the rules of the property. Nothing is rendered for `null`, `undefined` and `false`. */
    renderPropertyDetails?: (property: Property, context: SchemaPropertyContext) => ReactNode;

    /** Styles and marks the row of a property: extra class names, `data-*` attributes, a tooltip, and whether its type is locked. */
    getPropertyRowState?: (property: Property, context: SchemaPropertyContext) => SchemaPropertyRowState | undefined;

    /** Replaces any of the editor's strings. Unset ones stay English. */
    labels?: SchemaEditorLabels;

    /** Accessible name of the editor. Defaults to the `schema` label. */
    'aria-label'?: string;

    /** Id of the element that names the editor. */
    'aria-labelledby'?: string;

    /** Extra class name for the root. */
    className?: string;

    /** Attributes for the stable parts of the editor. */
    pt?: SchemaEditorParts;
}

const never = () => false;

/**
 * Edits the properties of a JSON Schema as a tree: names, types, nested objects and lists of objects, and
 * optionally concepts, the key, and whether a property is required.
 *
 * Pass a `schema` and the editor keeps the tree and reports the resulting schema, or pass `properties` and
 * handle each edit yourself. Everything specific to a product — rules, mapping connectors, its own chrome — is
 * attached through the slots (`header`, `footer`, `renderPropertyLeading`, `renderPropertyAccessory`,
 * `renderPropertyDetails`) and `getPropertyRowState`.
 */
export const SchemaEditor = ({
    schema,
    onChange,
    onPropertiesChange,
    onPropertyRemoved,
    onPropertyRenamed,
    properties: controlledProperties,
    onAddProperty,
    onAddChildProperty,
    onDeleteProperty,
    onRenameProperty,
    onChangePropertyType,
    onSetKeyProperty,
    onSetRequiredProperty,
    concepts: suppliedConcepts,
    allowKeyProperty = false,
    allowRequired = false,
    readOnly = false,
    isPropertyProtected,
    validatePropertyName,
    selectedPropertyId,
    onPropertyClick,
    header,
    footer,
    renderPropertyLeading,
    renderPropertyAccessory,
    renderPropertyDetails,
    getPropertyRowState,
    labels: suppliedLabels,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    className,
    pt,
}: SchemaEditorProps) => {
    const labels = useMemo(() => resolveSchemaEditorLabels(suppliedLabels), [suppliedLabels]);
    const providedConcepts = usePropertyConcepts();
    const concepts = suppliedConcepts ?? providedConcepts;
    const isControlled = controlledProperties !== undefined;
    const [ownedProperties, setOwnedProperties] = useState<Property[]>(() => jsonSchemaToProperties(schema));
    // The latest tree, kept synchronously so two edits in one event apply one after the other.
    const latest = useRef(ownedProperties);
    useEffect(() => { latest.current = ownedProperties; }, [ownedProperties]);
    const properties = isControlled ? controlledProperties : ownedProperties;

    // A schema from outside replaces the tree only when it says something the editor does not already show:
    // handing back what was reported, or the same schema again, must not throw away the property ids.
    const incomingSchema = schema === undefined ? undefined : JSON.stringify(schema);
    const [seenSchema, setSeenSchema] = useState(incomingSchema);
    if (!isControlled && incomingSchema !== seenSchema) {
        setSeenSchema(incomingSchema);
        if (schema !== undefined && incomingSchema !== JSON.stringify(propertiesToJsonSchema(ownedProperties))) {
            setOwnedProperties(jsonSchemaToProperties(schema));
        }
    }

    const apply = (next: Property[]) => {
        latest.current = next;
        setOwnedProperties(next);
        onChange?.(propertiesToJsonSchema(next));
        onPropertiesChange?.(next);
    };

    const ownedOperations: SchemaEditorOperations = {
        addChild: (parentId, type, concept) =>
            apply(addChildProperty(latest.current, parentId, type, totalPropertyCount(latest.current), concept)),
        remove: propertyId => {
            const removed = findPropertyById(latest.current, propertyId);
            apply(removeProperty(latest.current, propertyId));
            if (removed) onPropertyRemoved?.(removed);
        },
        rename: (propertyId, name) => {
            const previousName = findPropertyById(latest.current, propertyId)?.name;
            const next = renameProperty(latest.current, propertyId, name);
            apply(next);
            const renamed = findPropertyById(next, propertyId);
            if (renamed && previousName !== undefined) onPropertyRenamed?.(renamed, previousName);
        },
        changeType: (propertyId, type, concept) => apply(changePropertyType(latest.current, propertyId, type, concept)),
        setKey: propertyId => apply(setKeyProperty(latest.current, propertyId)),
        setRequired: (propertyId, isRequired) => apply(setRequiredProperty(latest.current, propertyId, isRequired)),
    };

    const controlledOperations: SchemaEditorOperations = {
        addChild: onAddChildProperty,
        remove: onDeleteProperty,
        rename: onRenameProperty,
        changeType: onChangePropertyType,
        setKey: onSetKeyProperty,
        setRequired: onSetRequiredProperty,
    };

    const operations = isControlled ? controlledOperations : ownedOperations;
    const addRoot = isControlled
        ? onAddProperty
        : (type: PropertyType, concept?: string) =>
            apply(addProperty(latest.current, type, totalPropertyCount(latest.current), concept));

    const isKeyAllowed = typeof allowKeyProperty === 'function'
        ? allowKeyProperty
        : allowKeyProperty ? () => true : never;

    const contextValue: SchemaEditorContextValue = {
        labels,
        parts: pt,
        properties,
        concepts,
        readOnly,
        operations,
        selectedPropertyId,
        onPropertyClick,
        isKeyAllowed,
        isRequiredAllowed: allowRequired,
        isProtected: isPropertyProtected ?? never,
        validateName: validatePropertyName,
        getRowState: getPropertyRowState,
        renderLeading: renderPropertyLeading,
        renderAccessory: renderPropertyAccessory,
        renderDetails: renderPropertyDetails,
    };

    return (
        <SchemaEditorContext.Provider value={contextValue}>
            <div
                {...pt?.root}
                role='group'
                aria-label={ariaLabelledBy ? undefined : ariaLabel ?? labels.schema}
                aria-labelledby={ariaLabelledBy}
                className={['cratis-schema-editor', pt?.root?.className, className].filter(Boolean).join(' ')}
                data-cratis-part='root'
                data-readonly={readOnly || undefined}
            >
                {header && (
                    <div {...pt?.header} className={`cratis-schema-editor__header ${pt?.header?.className ?? ''}`} data-cratis-part='header'>
                        {header}
                    </div>
                )}

                {properties.length === 0 ? (
                    <p {...pt?.empty} className={`cratis-schema-editor__empty ${pt?.empty?.className ?? ''}`} data-cratis-part='empty'>
                        {labels.noProperties}
                    </p>
                ) : (
                    <ul {...pt?.list} className={`cratis-schema-editor__list ${pt?.list?.className ?? ''}`} data-cratis-part='list'>
                        {properties.map(property => (
                            <SchemaPropertyRow key={property.id} property={property} siblings={properties} depth={0} />
                        ))}
                    </ul>
                )}

                {(footer || (!readOnly && addRoot)) && (
                    <div className='cratis-schema-editor__actions'>
                        {!readOnly && addRoot && (
                            <PropertyTypeMenu
                                labels={labels}
                                concepts={concepts}
                                triggerPart='add'
                                triggerLabel={labels.addProperty}
                                parts={pt}
                                onSelect={addRoot}
                            >
                                <FaPlus aria-hidden='true' />
                                {labels.addProperty}
                            </PropertyTypeMenu>
                        )}
                        {footer && (
                            <div {...pt?.footer} className={`cratis-schema-editor__footer ${pt?.footer?.className ?? ''}`} data-cratis-part='footer'>
                                {footer}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </SchemaEditorContext.Provider>
    );
};
