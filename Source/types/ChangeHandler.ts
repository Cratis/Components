// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChangeMeta } from './ChangeMeta';

/** Handles a semantic value change and optional information about its origin. */
export type ChangeHandler<T> = (value: T, meta?: ChangeMeta) => void;
