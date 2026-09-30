// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { MarkdownEditorMode } from './MarkdownEditorMode';

/**
 * Works out the mode the mode toggle moves to from the one being shown.
 * @param mode The {@link MarkdownEditorMode} currently on screen.
 * @returns The mode to show next.
 */
export const nextMarkdownEditorMode = (mode: MarkdownEditorMode): MarkdownEditorMode =>
    mode === MarkdownEditorMode.Preview ? MarkdownEditorMode.Write : MarkdownEditorMode.Preview;
