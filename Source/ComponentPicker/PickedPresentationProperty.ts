// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PresentationPropertyType } from '../configuration/identity/PresentationPropertyType';
import type { PresentationPropertyValue } from '../configuration/identity/PresentationPropertyValue';

/** One presentation property of a picked component, with the value it was rendered with. */
export interface PickedPresentationProperty {
    /** The prop name. */
    name: string;
    /** Human-readable label. */
    label: string;
    /** How the property is edited. */
    type: PresentationPropertyType;
    /** The allowed values of an enumeration. */
    values?: readonly (string | number)[];
    /** What the property changes. */
    description?: string;
    /** The value the component uses when the prop is not set. */
    defaultValue?: PresentationPropertyValue;
    /** The value the component was rendered with. `undefined` when the prop is not set. */
    value: PresentationPropertyValue;
    /** `false` when the rendered value is not a plain string, number or boolean, so it cannot be edited here. */
    editable: boolean;
}
