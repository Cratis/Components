// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Joins the defined class names with a single space. */
export const classNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');
