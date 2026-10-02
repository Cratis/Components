// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyChoice } from './PropertyChoice';

/** What every property descriptor shares. */
export interface PropertyDescriptorBase {
    /** Key of the property in the values object. Also the identity of the control. */
    name: string;

    /** Localizable name of the control. */
    label: string;

    /** Optional help text shown with the control. */
    description?: string;

    /** Whether the property can change. Defaults to `true`; `false` shows the value without letting it change. */
    editable?: boolean;

    /** Why the property is not editable. Shown as text next to the control. */
    unavailableReason?: string;
}

/** A free-text property. */
export interface TextPropertyDescriptor extends PropertyDescriptorBase {
    /** Discriminant: a free-text property. */
    kind: 'text';
    /** Hint shown while the field is empty. */
    placeholder?: string;
}

/** A numeric property such as a gap, a column count or a span. */
export interface NumberPropertyDescriptor extends PropertyDescriptorBase {
    /** Discriminant: a numeric property. */
    kind: 'number';
    /** Smallest accepted value. */
    min?: number;
    /** Largest accepted value. */
    max?: number;
    /** Step of the native number input. */
    step?: number;
    /** Unit shown after the field, for example `px` or `columns`. */
    unit?: string;
    /** Whether the property must have a value. An empty required field is invalid; an optional one clears the property. */
    required?: boolean;
}

/** An on/off property. */
export interface BooleanPropertyDescriptor extends PropertyDescriptorBase {
    /** Discriminant: an on/off property. */
    kind: 'boolean';
}

/** A property chosen from a fixed set of options. */
export interface ChoicePropertyDescriptor extends PropertyDescriptorBase {
    /** Discriminant: a property chosen from `options`. */
    kind: 'choice';
    /** The options the host supports for this property. */
    options: ReadonlyArray<PropertyChoice>;
}

/**
 * Describes one property control. The host owns what exists and what it means: an alignment, a
 * grid column span or a responsive override are all just descriptors, and nothing here knows a
 * layout engine.
 */
export type PropertyDescriptor =
    | TextPropertyDescriptor
    | NumberPropertyDescriptor
    | BooleanPropertyDescriptor
    | ChoicePropertyDescriptor;
