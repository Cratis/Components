// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChangeHandler } from '../types/ChangeHandler';

/** Props passed to a custom filter editor render function. */
export interface FilterEditorProps {
    /** The current value for this filter, or `undefined` when unset. */
    value: unknown;
    /** Called with the custom filter value and optional change-origin metadata. */
    onChange: ChangeHandler<unknown>;
}
