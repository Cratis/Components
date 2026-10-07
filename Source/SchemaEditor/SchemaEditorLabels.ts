// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * User-facing strings for {@link SchemaEditor}. Every field is optional; pass a
 * partial `labels` to override any of them (for localization). Omitted fields
 * fall back to {@link defaultSchemaEditorLabels} (English).
 */
export interface SchemaEditorLabels {
    /** Menu action that enters edit mode. */
    edit: string;
    /** Menu action that saves changes. */
    save: string;
    /** Menu action that cancels editing. */
    cancel: string;
    /** Menu action that adds a property. */
    addProperty: string;
    /** Accessible name for the action menubar. */
    actions: string;
    /** Accessible name and tooltip for the back button. */
    navigateBack: string;
    /** Shown when the schema has no properties. */
    emptyMessage: string;
    /** Accessible name for the "drill into array item definition" button. */
    navigateToItemDefinition: string;
    /** Accessible name for the "drill into object properties" button. */
    navigateToProperties: string;
    /** Accessible name for a property-name input. */
    propertyName: string;
    /** Accessible name for a property-type selector. */
    propertyType: string;
    /** Accessible name for an array item-type selector. */
    arrayItemType: string;
    /** Accessible name for the "remove property" button. */
    deleteProperty: string;
    /** Validation message shown when the schema cannot be represented as valid JSON. */
    invalidJson: string;

    /** Tree layout and capabilities: accessible name of the editor when the host supplies none. Default `Schema properties`. */
    schema?: string;
    /** Tree layout: accessible name of the button that adds a property to a nested object. */
    addPropertyTo?: (propertyName: string) => string;
    /** Tree layout: accessible name of the list of properties nested under a property. */
    nestedProperties?: (propertyName: string) => string;
    /** Tree layout: accessible name of the input used to rename a property. Receives the property's current name. */
    propertyNameFor?: (propertyName: string) => string;
    /** Tree layout: tooltip of the control that starts renaming a property. */
    renameHint?: string;
    /** Tree layout: accessible name of the button that removes a property. */
    deletePropertyFor?: (propertyName: string) => string;
    /** Tree layout: accessible name of the button that opens the menu of types; receives the current type's name. */
    changeType?: (propertyName: string, typeName: string) => string;
    /** Tree layout: accessible name of the menu of types. */
    propertyTypes?: string;
    /** Heading of the concepts in the menu of types. */
    concepts?: string;
    /** Disabled hint in the menu of types when concepts are enabled but none are defined. */
    noConcepts?: string;
    /** Visible text of the toggle for whether a property must be present (`allowRequired`). */
    required?: string;
    /** Accessible name of the toggle for whether a property must be present. */
    requiredProperty?: (propertyName: string) => string;
    /** Explains what the required toggle means. */
    requiredHelp?: string;
    /** Accessible name of the toggle that makes a property the key of its object (`allowKeyProperty`). */
    keyProperty?: (propertyName: string) => string;
    /** Tooltip of the key toggle while the property is not the key. */
    setAsKey?: string;
    /** Tooltip of the key toggle while the property is the key. */
    isKey?: string;
    /** Column header of the key column in the table layout. */
    keyColumn?: string;
    /** Column header of the required column in the table layout. */
    requiredColumn?: string;
    /** Why a property cannot be renamed or removed (`isPropertyProtected`). */
    protectedProperty?: string;
    /** Tree layout: validation message for a blank name. */
    nameRequired?: string;
    /** Tree layout: validation message for a name that would shadow a member every object inherits. */
    nameReserved?: (name: string) => string;
    /** Tree layout: validation message for a name a sibling already uses. */
    nameDuplicate?: (name: string) => string;
    /** Tree layout: name of the `string` type. */
    typeString?: string;
    /** Tree layout: name of the `number` type. */
    typeNumber?: string;
    /** Tree layout: name of the `boolean` type. */
    typeBoolean?: string;
    /** Tree layout: name of the `date` type. */
    typeDate?: string;
    /** Tree layout: name of the `time` type. */
    typeTime?: string;
    /** Tree layout: name of the list-of-text type. */
    typeStringArray?: string;
    /** Tree layout: name of the list-of-numbers type. */
    typeNumberArray?: string;
    /** Tree layout: name of the nested object type. */
    typeObject?: string;
    /** Tree layout: name of the list-of-objects type. */
    typeObjectArray?: string;
}
