// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * How a {@link ToolbarFolder} presents its expanded panel.
 *
 * - `'compact'` — the existing popout: icon-only grid cells or a labeled list (see {@link ToolbarFolderMode}).
 * - `'drawer'` — a headed drawer with a visible title, a close action and labeled icon tiles.
 */
export type ToolbarFolderPresentation = 'compact' | 'drawer';
