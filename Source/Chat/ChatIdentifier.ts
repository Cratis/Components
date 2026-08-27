// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * An identifier as the chat components accept it — a string, or anything that renders itself as
 * one (a `Guid` from `@cratis/fundamentals`, a number, a custom id type). The components never
 * inspect an identifier beyond turning it into a string, so a host can hand them whatever its
 * data source delivers without mapping every record first.
 */
export type ChatIdentifier = string | { toString(): string };

/**
 * The canonical string form of an identifier, used for React keys and comparisons.
 * @param identifier The identifier to render.
 * @returns The identifier as a string.
 */
export const chatIdentifierString = (identifier: ChatIdentifier): string => String(identifier);

/**
 * Whether two identifiers refer to the same thing, compared by their string form so a `Guid`
 * and the string it prints as are the same identifier.
 * @param left One identifier, possibly not set.
 * @param right The other identifier, possibly not set.
 * @returns True when both are set and equal.
 */
export const sameChatIdentifier = (left?: ChatIdentifier, right?: ChatIdentifier): boolean =>
    left !== undefined && right !== undefined && String(left) === String(right);
