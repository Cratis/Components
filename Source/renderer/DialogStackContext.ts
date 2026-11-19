// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createContext, useContext } from 'react';

/**
 * The resolved z-index of the nearest ancestor {@link DialogImplementation}, or `null` when
 * rendered outside any dialog. Overlay-producing descendants (dropdown popovers, date-picker
 * popovers, tooltips, filter menus) read this to stack themselves above their owning dialog instead
 * of relying on the static overlay token, which does not account for dialog nesting depth.
 *
 * This is a CSS expression rather than a number - it stays relative to the `--cratis-z-index-dialog`
 * token so an application that retunes that token keeps its dialogs, and everything they host, in
 * its own stacking order. Compose onto it with `zIndexAboveDialog` rather than doing arithmetic.
 */
export const DialogStackContext = createContext<string | null>(null);

/**
 * The overlay host an overlay-producing descendant opened in. Unlike {@link DialogStackContext}, it
 * carries the host's identity and whether it is still open, so a descendant can tell a closed host
 * from an open one even though both resolve to the same z-index token.
 */
export interface OverlayHostState {
    /** Unique per host instance, so a reused stacking tier can never alias two hosts. */
    readonly id: string;
    /** False from the moment the host starts closing, while its children are still mounted. */
    readonly open: boolean;
    /** The host's resolved z-index, as a CSS expression. */
    readonly stackZIndex: string;
}

/** The nearest ancestor overlay host, or `null` when rendered outside any host. */
export const OverlayHostContext = createContext<OverlayHostState | null>(null);

/** Reads the nearest ancestor dialog's resolved z-index. `null` when not nested in a dialog. */
export const useNearestDialogZIndex = (): string | null => useContext(DialogStackContext);
