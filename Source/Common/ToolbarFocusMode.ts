// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Keyboard focus behavior for Toolbar and ActionMenubar. */
export enum ToolbarFocusMode {
    /** Navigate with arrows and Home/End while retaining every tool's Tab stop (default). */
    Arrows = 'arrows',
    /** Navigate with arrows and Home/End with one roving Tab stop. */
    SingleTabStop = 'singleTabStop',
    /** Keep native focus behavior with no toolbar keyboard handling. */
    None = 'none',
}
