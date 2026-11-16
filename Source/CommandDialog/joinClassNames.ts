// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Joins a stable class name with an optional caller-supplied one, skipping empty values. */
export const joinClassNames = (base: string, extra?: string): string =>
    [base, extra].filter(Boolean).join(' ');
