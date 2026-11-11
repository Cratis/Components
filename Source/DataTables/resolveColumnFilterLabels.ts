// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ColumnFilterMenuLabels } from './ColumnFilterMenu';

const labelKeys: (keyof ColumnFilterMenuLabels)[] = [
    'filterTriggerAriaLabel',
    'valueAriaLabel',
    'matchModeAriaLabel',
    'matchModeLabel',
    'clear',
    'apply',
    'true',
    'false',
];

/** Each label comes from the explicit labels, else the provider messages, else the defaults. */
export const resolveColumnFilterLabels = (
    labels: Partial<ColumnFilterMenuLabels> | undefined,
    providerMessages: Partial<ColumnFilterMenuLabels> | undefined,
    defaults: ColumnFilterMenuLabels,
): ColumnFilterMenuLabels => {
    const resolved: Record<string, unknown> = {};
    for (const key of labelKeys) {
        resolved[key] = labels?.[key] ?? providerMessages?.[key] ?? defaults[key];
    }
    return resolved as unknown as ColumnFilterMenuLabels;
};
