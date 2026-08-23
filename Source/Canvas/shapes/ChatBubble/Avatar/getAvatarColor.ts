// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9', '#10b981', '#14b8a6'];

/**
 * Computes a deterministic avatar background color from a stable seed - the person's identifier -
 * so the same person always shows the same fallback color everywhere their avatar appears,
 * regardless of how their name is rendered in that context.
 * @param seed A stable identifier for the person (e.g. their user id as a string).
 * @returns A hex color from the predefined avatar palette.
 */
export const getAvatarColor = (seed: string): string => {
    let hash = 0;
    for (let charIndex = 0; charIndex < seed.length; charIndex++) {
        hash = (hash * 31 + seed.charCodeAt(charIndex)) | 0;
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
