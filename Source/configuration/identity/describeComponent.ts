// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentDescriptor } from './ComponentDescriptor';
import type { PresentationPropertyDescriptor } from './PresentationPropertyDescriptor';

/**
 * Declares which props of a component change its presentation. The property names are checked
 * against the component's props.
 * @param component - The public component name.
 * @param properties - The presentation props.
 * @returns The frozen descriptor.
 */
export const describeComponent = <TProps extends object>(
    component: string,
    properties: readonly PresentationPropertyDescriptor<TProps>[],
): ComponentDescriptor<TProps> => Object.freeze({ component, properties: Object.freeze([...properties]) });
