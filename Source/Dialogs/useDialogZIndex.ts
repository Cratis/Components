// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useState } from 'react';
import { closeDialogTier, dialogZIndexForTier, openDialogTier } from '../renderer/dialogStack';

/**
 * Assigns a dialog a strictly increasing tier for as long as it is visible, so a second
 * dialog opened from a child of this one stacks above it rather than colliding on the same
 * static z-index.
 * @param visible Whether the dialog is visible.
 * @returns The z-index for the dialog's tier, or undefined while it has none.
 */
export const useDialogZIndex = (visible: boolean) => {
    const [dialogTier, setDialogTier] = useState<number | null>(null);
    useLayoutEffect(() => {
        if (!visible) {
            setDialogTier(null);
            return;
        }
        const tier = openDialogTier();
        setDialogTier(tier);
        return () => closeDialogTier(tier);
    }, [visible]);
    return dialogTier === null ? undefined : dialogZIndexForTier(dialogTier);
};
