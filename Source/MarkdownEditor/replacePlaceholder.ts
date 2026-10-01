// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Replaces an upload placeholder with what it stood for, wherever it ended up.
 *
 * By value rather than by remembered position: the caret moves and other uploads finish while this one
 * is in flight, so the offset the placeholder went in at is stale by the time it comes back. A
 * placeholder that is no longer there - deleted while uploading - leaves the markdown untouched rather
 * than putting the result somewhere arbitrary.
 * @param value The markdown as it is now.
 * @param placeholder The placeholder that was inserted.
 * @param replacement What to put in its place - empty to drop it, as on a failed upload.
 * @returns The markdown with the placeholder resolved.
 */
export const replacePlaceholder = (value: string, placeholder: string, replacement: string): string =>
    value.includes(placeholder) ? value.replace(placeholder, () => replacement) : value;
