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

/** Reads the nearest ancestor dialog's resolved z-index. `null` when not nested in a dialog. */
export const useNearestDialogZIndex = (): string | null => useContext(DialogStackContext);
