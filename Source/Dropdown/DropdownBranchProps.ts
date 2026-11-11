// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DropdownProps } from './Dropdown';
import type { useDropdownHandlers } from './useDropdownHandlers';
import type { DropdownState } from './useDropdownState';

/** What every dropdown variant receives: the public props, the derived state and the handlers. */
export interface DropdownBranchProps<T> {
    props: DropdownProps<T>;
    state: DropdownState;
    handlers: ReturnType<typeof useDropdownHandlers<T>>;
}
