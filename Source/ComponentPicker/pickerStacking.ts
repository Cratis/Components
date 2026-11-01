// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    DIALOG_ZINDEX_TOKEN,
    dialogZIndexForTier,
    topDialogTier,
    zIndexAboveDialog,
} from '../renderer/dialogStack';

/** Above tooltips, which sit 200 above their dialog. */
const pickerOffset = 300;

/** The z-index that keeps picker overlays above the topmost open dialog and everything it hosts. */
export const pickerZIndex = (): string => {
    const tier = topDialogTier();
    return zIndexAboveDialog(tier === null ? DIALOG_ZINDEX_TOKEN : dialogZIndexForTier(tier), pickerOffset);
};
