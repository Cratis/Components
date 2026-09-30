// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The placeholder that stands where a file is going while it uploads.
 *
 * The text lands at the caret the moment a file is pasted or dropped, so the editor shows it took the
 * file, keeps the position while several upload at once, and leaves something to point at when one
 * fails.
 * @param fileName The name of the file being uploaded.
 * @returns The placeholder text.
 */
export const uploadPlaceholderFor = (fileName: string): string => `![Uploading ${fileName}…]()`;
