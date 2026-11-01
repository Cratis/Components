// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PresentationPropertyValue } from './PresentationPropertyValue';

/** A proposed change to one presentation property. */
export interface PresentationChange {
    /** The property name. */
    property: string;
    /** The value before the change. */
    from: PresentationPropertyValue;
    /** The proposed value. */
    to: PresentationPropertyValue;
}
