// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Builds the DOM id of a suggestion option from its list's id and its position, never from the
 * candidate's own id, which comes from the host and can repeat across composers.
 * @param listId The id of the suggestion list.
 * @param index The option's position in the list.
 * @returns The id the textarea's `aria-activedescendant` refers to.
 */
export const mentionOptionId = (listId: string, index: number): string => `${listId}-option-${index}`;
