// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyControlsLabels } from './PropertyControlsLabels';

/** The English strings {@link PropertyControls} falls back to. */
export const defaultPropertyControlsLabels: Required<PropertyControlsLabels> = {
    required: 'Enter a value.',
    notANumber: 'Enter a number.',
    belowMinimum: (minimum) => `Enter ${minimum} or more.`,
    aboveMaximum: (maximum) => `Enter ${maximum} or less.`,
    unset: 'Not set',
    on: 'On',
    off: 'Off',
};
