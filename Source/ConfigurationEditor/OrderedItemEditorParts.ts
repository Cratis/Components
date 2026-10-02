// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import type { ConfigurationEditorPartAttributes } from './ConfigurationEditorPartAttributes';

/**
 * Stable Cratis-owned parts for styling an {@link OrderedItemEditor}. Each is marked with a matching
 * `data-cratis-part` attribute and receives what is passed here; the editor's own wiring wins.
 */
export interface OrderedItemEditorParts {
    /** The editor root. */
    root?: ConfigurationEditorPartAttributes<HTMLDivElement>;

    /** A section of items: the fixed items or the configurable items. Carries `data-section`. */
    section?: ConfigurationEditorPartAttributes<HTMLElement>;

    /** A section's heading. */
    sectionTitle?: ConfigurationEditorPartAttributes<HTMLHeadingElement>;

    /** A section's list of items. */
    list?: ConfigurationEditorPartAttributes<HTMLUListElement>;

    /** One item. Carries `data-locked`, `data-dragging` and `data-drop-position`. */
    item?: ConfigurationEditorPartAttributes<HTMLLIElement>;

    /** The control that starts a drag and reorders with the arrow keys. */
    handle?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The move-up action. */
    moveUp?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The move-down action. */
    moveDown?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The label input. */
    label?: InputHTMLAttributes<HTMLInputElement>;

    /** The wrapper of the icon field. Carries `data-unavailable` for an icon the catalog cannot supply. */
    icon?: ConfigurationEditorPartAttributes<HTMLDivElement>;

    /** The destination select. */
    destination?: SelectHTMLAttributes<HTMLSelectElement>;

    /** The remove action. */
    remove?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** The add action. */
    add?: ButtonHTMLAttributes<HTMLButtonElement>;

    /** A validation message or a reason a control is restricted. */
    message?: ConfigurationEditorPartAttributes<HTMLParagraphElement>;

    /** The text that says an item is locked. */
    state?: ConfigurationEditorPartAttributes<HTMLSpanElement>;

    /** The text shown for an empty collection. */
    empty?: ConfigurationEditorPartAttributes<HTMLParagraphElement>;

    /** The live region that announces a move. */
    status?: ConfigurationEditorPartAttributes<HTMLDivElement>;
}
