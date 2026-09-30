// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import {
    FaBold,
    FaCode,
    FaFileCode,
    FaHeading,
    FaItalic,
    FaLink,
    FaListCheck,
    FaListOl,
    FaListUl,
    FaQuoteRight,
    FaStrikethrough,
} from 'react-icons/fa6';
import { MarkdownFormat } from './MarkdownFormat';

/** The glyph drawn on each formatting button. */
export const formatIcons: Record<MarkdownFormat, ReactNode> = {
    [MarkdownFormat.Heading]: <FaHeading />,
    [MarkdownFormat.Bold]: <FaBold />,
    [MarkdownFormat.Italic]: <FaItalic />,
    [MarkdownFormat.Strikethrough]: <FaStrikethrough />,
    [MarkdownFormat.Quote]: <FaQuoteRight />,
    [MarkdownFormat.Code]: <FaCode />,
    [MarkdownFormat.CodeBlock]: <FaFileCode />,
    [MarkdownFormat.Link]: <FaLink />,
    [MarkdownFormat.BulletList]: <FaListUl />,
    [MarkdownFormat.NumberedList]: <FaListOl />,
    [MarkdownFormat.TaskList]: <FaListCheck />,
};
