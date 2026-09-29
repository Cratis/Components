// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Joins the class names that are set, skipping empty, undefined and false values.
 * @param values Class names, some possibly unset.
 * @returns The space-separated class names.
 */
export const classNames = (...values: Array<string | undefined | false>) =>
    values.filter(Boolean).join(' ');
