// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PresentationPropertyDescriptor } from './PresentationPropertyDescriptor';

/**
 * The static, typed list of a component's presentation props.
 * @typeParam TProps - The component's props.
 */
export interface ComponentDescriptor<TProps extends object = object> {
    /** The public component name, as rendered in `data-cratis-component`. */
    readonly component: string;
    /** The presentation props, in the order an editor lists them. */
    readonly properties: readonly PresentationPropertyDescriptor<TProps>[];
}
