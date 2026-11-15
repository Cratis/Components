// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useNearestDialogZIndex } from '../../renderer/DialogStackContext';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../../renderer/dialogStack';

export function useOverlayLayer() {
    const nearestDialogZIndex = useNearestDialogZIndex();
    return nearestDialogZIndex === null
        ? 'var(--cratis-z-index-overlay, 1300)'
        : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);
}
