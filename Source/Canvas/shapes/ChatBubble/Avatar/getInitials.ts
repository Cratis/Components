// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Computes up to two uppercase initials from a display name.
 * @param name The display name.
 * @returns One or two initials, or '?' when none can be derived.
 */
export const getInitials = (name: string): string =>
    name.trim().split(/\s+/).filter(Boolean).map(word => word[0]).join('').slice(0, 2).toUpperCase() || '?';
