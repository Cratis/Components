// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Every visible and accessible string the {@link SchemaEditor} owns. Unset fields fall back to English, so a
 * localized application passes only what it translates. Functions receive the name of the property they act on,
 * so each control names the property it belongs to.
 */
export interface SchemaEditorLabels {
    /** Accessible name of the editor when the host supplies none. */
    schema?: string;
    /** Shown when the schema has no properties. */
    noProperties?: string;
    /** Text of the button that adds a property to the root or to a nested object. */
    addProperty?: string;
    /** Accessible name of the button that adds a property to a nested object. */
    addPropertyTo?: (propertyName: string) => string;
    /** Accessible name of the list of properties nested under a property. */
    nestedProperties?: (propertyName: string) => string;
    /** Accessible name of the input used to rename a property. */
    propertyName?: (propertyName: string) => string;
    /** Tooltip of the control that starts renaming a property. */
    renameHint?: string;
    /** Accessible name of the button that removes a property. */
    deleteProperty?: (propertyName: string) => string;
    /** Accessible name of the button that opens the menu of types for a property; receives the current type's name. */
    changeType?: (propertyName: string, typeName: string) => string;
    /** Accessible name of the menu of types. */
    propertyTypes?: string;
    /** Heading of the concepts in the menu of types. */
    concepts?: string;
    /** Visible text of the toggle for whether a property must be present. */
    required?: string;
    /** Accessible name of the toggle for whether a property must be present. */
    requiredProperty?: (propertyName: string) => string;
    /** Explains what the required toggle means. */
    requiredHelp?: string;
    /** Accessible name of the toggle that makes a property the key of its object. */
    keyProperty?: (propertyName: string) => string;
    /** Tooltip of the key toggle while the property is not the key. */
    setAsKey?: string;
    /** Tooltip of the key toggle while the property is the key. */
    isKey?: string;
    /** Why a property cannot be renamed or removed. */
    protectedProperty?: string;
    /** Validation message for a blank name. */
    nameRequired?: string;
    /** Validation message for a name that would shadow a member every object inherits. */
    nameReserved?: (name: string) => string;
    /** Validation message for a name a sibling already uses. */
    nameDuplicate?: (name: string) => string;
    /** Name of the `string` type. */
    typeString?: string;
    /** Name of the `number` type. */
    typeNumber?: string;
    /** Name of the `boolean` type. */
    typeBoolean?: string;
    /** Name of the `date` type. */
    typeDate?: string;
    /** Name of the `time` type. */
    typeTime?: string;
    /** Name of the list-of-text type. */
    typeStringArray?: string;
    /** Name of the list-of-numbers type. */
    typeNumberArray?: string;
    /** Name of the nested object type. */
    typeObject?: string;
    /** Name of the list-of-objects type. */
    typeObjectArray?: string;
}
