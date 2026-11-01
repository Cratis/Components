// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentDescriptor } from './ComponentDescriptor';

/** What the registry knows about one rendered component that declared presentation props. */
export interface RegisteredComponent {
    /** The component's descriptor. */
    readonly descriptor: ComponentDescriptor;
    /** The props the component was rendered with, before any live preview was applied. */
    readonly props: Readonly<Record<string, unknown>>;
}
