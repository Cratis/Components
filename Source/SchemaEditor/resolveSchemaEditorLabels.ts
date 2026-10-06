// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultSchemaEditorLabels } from './defaultSchemaEditorLabels';
import type { SchemaEditorLabels } from './SchemaEditorLabels';

/** Merges the host's labels over the English defaults, ignoring any that are `undefined`. */
export const resolveSchemaEditorLabels = (labels: SchemaEditorLabels | undefined): Required<SchemaEditorLabels> => {
    const resolved: Record<string, unknown> = { ...defaultSchemaEditorLabels };
    for (const [key, value] of Object.entries(labels ?? {})) {
        if (value !== undefined) resolved[key] = value;
    }
    return resolved as unknown as Required<SchemaEditorLabels>;
};
