// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Keyboard focus behavior for Toolbar and ActionMenubar. */
export enum ToolbarFocusMode {
    /** Navigate with arrows and Home/End while retaining every tool's Tab stop (default). */
    Arrows = 'arrows',
    /**
     * Navigate with arrows and Home/End, with one Tab stop for the toolbar's own tools that
     * returns to the last focused tool (the WAI-ARIA toolbar pattern). Controls you add yourself,
     * widgets such as inputs and sliders, tools rendered outside the toolbar's own markup (for example
     * through a portal), and tools with an explicit tab index keep their own Tab stop. An explicit
     * tab index of -1 removes the tool from both Tab and arrow-key navigation.
     */
    SingleTabStop = 'singleTabStop',
    /** Keep native focus behavior with no toolbar keyboard handling. */
    None = 'none',
}
