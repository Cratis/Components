// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChangeMeta } from './ChangeMeta';

/**
 * Handles a Components-owned semantic value change.
 *
 * The first argument is always the component's next value, never a renderer-specific
 * event wrapper. Origin metadata is optional so ordinary one-argument callbacks such as
 * React state setters remain directly assignable.
 *
 * @typeParam T - The semantic value exposed by the component.
 * @param value - The next semantic value.
 * @param meta - Optional information about how the change originated.
 */
export type ChangeHandler<T> = (value: T, meta?: ChangeMeta) => void;
