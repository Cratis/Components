// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Icon } from '../Common/Icon';

/**
 * One entry of a catalogue shown as a labeled tile inside a drawer {@link ToolbarFolder}.
 *
 * The drawer never interprets {@link payload}: the exact value supplied here is delivered unchanged
 * to the consumer when the tile is activated and when it is dragged, so the consumer decides what
 * the item means and where it is inserted.
 */
export interface ToolbarDrawerItem {
    /** Stable identity of the item. Used as the React key and never derived from {@link title}. */
    id: string;

    /** Always-visible, localizable tile label. Also the tile's accessible name. */
    title: string;

    /** Icon shown above the label. */
    icon: Icon;

    /** Consumer-owned data delivered unchanged on activation and on drag. */
    payload: unknown;

    /** Whether the item is unavailable. A disabled tile stays focusable so its reason can be read. */
    disabled?: boolean;

    /** Explanation shown as the tile description when {@link disabled}. */
    disabledReason?: string;
}
