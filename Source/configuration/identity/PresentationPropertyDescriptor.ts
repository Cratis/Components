// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PresentationPropertyValue } from './PresentationPropertyValue';

/**
 * One presentation prop of a component: its name, how it is edited and, for an enumeration, the
 * values it allows. Behavior and data props are never described.
 * @typeParam TProps - The component's props. `name` must be one of its keys.
 */
export type PresentationPropertyDescriptor<TProps extends object = object> = {
    /** The prop name. */
    name: keyof TProps & string;
    /** Human-readable label for an editor. */
    label: string;
    /** What the prop changes, for an editor to show. */
    description?: string;
    /** The value the component uses when the prop is not set. */
    defaultValue?: PresentationPropertyValue;
} & (
    | { type: 'string' | 'boolean' | 'number' }
    | { type: 'enum'; values: readonly (string | number)[] }
);
