// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';

/** What the {@link SchemaEditor} tells the host about the row it is asking it to render or describe. */
export interface SchemaPropertyContext {
    /** How deeply the property is nested; root properties are at depth `0`. */
    depth: number;

    /** The properties that share the property's parent, including the property itself. */
    siblings: Property[];

    /** The whole property tree currently shown, so a slot can resolve other properties by id or name. */
    properties: Property[];

    /** Whether the editor is read-only. A slot should offer no edits while it is. */
    readOnly: boolean;
}
