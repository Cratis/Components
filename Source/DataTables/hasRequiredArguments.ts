// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Whether every required query argument has a value, by the rule Arc uses before it sends a snapshot
 * query: undefined, null and an empty string count as missing.
 * @param required The names of the query's required arguments.
 * @param args The query arguments.
 * @returns True when no required argument is missing.
 */
export const hasRequiredArguments = (required: readonly string[], args?: object): boolean =>
    required.every((name) => {
        const value = (args as Record<string, unknown> | undefined)?.[name];
        return value !== undefined && value !== null && value !== '';
    });
