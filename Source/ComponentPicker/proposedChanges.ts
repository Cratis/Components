// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PresentationChange } from '../configuration/identity/PresentationChange';
import type { PresentationPropertyValue } from '../configuration/identity/PresentationPropertyValue';
import type { PickedComponent } from './PickedComponent';

/**
 * The changes between a picked component's rendered values and a draft of new values.
 * @param picked - The picked component.
 * @param draft - New values by property name. A property missing from the draft is unchanged.
 * @returns One `{ property, from, to }` per property whose value differs, in descriptor order.
 */
export const proposedChanges = (
    picked: PickedComponent,
    draft: Readonly<Record<string, PresentationPropertyValue>>,
): PresentationChange[] =>
    picked.presentationProperties
        .filter((property) => property.editable && property.name in draft && draft[property.name] !== property.value)
        .map((property) => ({ property: property.name, from: property.value, to: draft[property.name] }));
