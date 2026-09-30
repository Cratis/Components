// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { MarkdownFormat } from './MarkdownFormat';

/** The formats reachable with Control (Command on macOS) and a letter, keyed by the lowercase letter. */
export const formatShortcuts: ReadonlyMap<string, MarkdownFormat> = new Map([
    ['b', MarkdownFormat.Bold],
    ['i', MarkdownFormat.Italic],
    ['k', MarkdownFormat.Link],
]);
