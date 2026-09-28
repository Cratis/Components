// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Keyboard focus behavior for Toolbar and ActionMenubar. A single-Tab-stop mode is planned for #353. */
export enum ToolbarFocusMode {
    /** Navigate with arrows and Home/End while retaining every tool's Tab stop (default). */
    Arrows = 'arrows',
    /** Keep native focus behavior with no toolbar keyboard handling. */
    None = 'none',
}
