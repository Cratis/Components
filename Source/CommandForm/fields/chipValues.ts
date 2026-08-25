// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Adds normalized chip candidates while preserving insertion order, duplicate policy, and max size.
 * Internal to the command-field implementation.
 */
export const appendChipCandidates = (
    current: readonly string[],
    candidates: readonly string[],
    max: number | undefined,
    allowDuplicate: boolean,
): string[] => {
    const availableSlots =
        max === undefined ? Number.POSITIVE_INFINITY : Math.max(0, max - current.length);
    const seen = new Set(current);
    const additions: string[] = [];

    for (const candidate of candidates) {
        if (!allowDuplicate && seen.has(candidate)) continue;
        if (additions.length >= availableSlots) break;
        additions.push(candidate);
        seen.add(candidate);
    }

    return [...current, ...additions];
};
