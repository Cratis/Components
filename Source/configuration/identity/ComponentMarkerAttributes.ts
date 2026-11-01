// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** The identity attributes a component spreads onto its root element. */
export interface ComponentMarkerAttributes {
    /** The public component name. */
    'data-cratis-component': string;
    /** The consumer's `id` or `name`, when there is one. */
    'data-cratis-component-id'?: string;
    /** Links the root to its live presentation registration. Present only on components that declare presentation properties. */
    'data-cratis-component-instance'?: string;
}
