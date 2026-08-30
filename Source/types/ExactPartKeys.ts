// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Resolves to true only when a pass-through declaration has the expected keys. */
export type ExactPartKeys<TParts, TExpected extends PropertyKey> = [
    Exclude<keyof TParts, TExpected>,
    Exclude<TExpected, keyof TParts>,
] extends [never, never]
    ? true
    : never;
