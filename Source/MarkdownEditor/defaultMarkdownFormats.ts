// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { MarkdownFormat } from './MarkdownFormat';

/**
 * The toolbar a {@link MarkdownEditor} shows when the host does not choose one: text styles, then
 * blocks and links, then lists. Each inner list is a group, drawn with a separator between groups.
 */
export const defaultMarkdownFormats: readonly (readonly MarkdownFormat[])[] = [
    [MarkdownFormat.Heading, MarkdownFormat.Bold, MarkdownFormat.Italic, MarkdownFormat.Strikethrough],
    [MarkdownFormat.Quote, MarkdownFormat.Code, MarkdownFormat.CodeBlock, MarkdownFormat.Link],
    [MarkdownFormat.BulletList, MarkdownFormat.NumberedList, MarkdownFormat.TaskList],
];
