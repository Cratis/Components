// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Joins the class names that are set.
 * @param values Class names, some possibly undefined.
 * @returns The space-separated class names.
 */
export const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');
