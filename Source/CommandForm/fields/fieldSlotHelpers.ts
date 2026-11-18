// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChangeEvent } from 'react';
import type { ChangeMeta } from '../../types/ChangeMeta';

// Internal helpers for the CommandForm field Core slot implementations. They emit no
// data-cratis-part markers, so part ownership stays in each field's own source file.

/** Joins the truthy class names with a single space. */
export const joinClassNames = (...names: Array<string | undefined>) =>
    names.filter(Boolean).join(' ');

/** Metadata describing a change that originated from a native user event. */
export const userChange = (event: ChangeEvent): ChangeMeta => ({
    source: 'user',
    nativeEvent: event.nativeEvent,
});

/** Choice-control state handed from a Core component to its part components. */
export interface ChoiceState {
    disabled?: boolean;
    invalid?: boolean;
    selected?: boolean;
}
