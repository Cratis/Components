// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Match Arc's sorted, JSON-serialized argument values when keying a bound query subscriber. */
export const serializeQueryArguments = (args?: object): string => {
    if (!args || Object.keys(args).length === 0) return '';
    const sorted = Object.keys(args).sort().reduce<Record<string, unknown>>((entries, key) => {
        entries[key] = (args as Record<string, unknown>)[key];
        return entries;
    }, {});
    return JSON.stringify(sorted);
};
