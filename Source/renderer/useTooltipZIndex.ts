// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { TOOLTIP_OFFSET, zIndexAboveDialog } from './dialogStack';
import { useNearestDialogZIndex } from './DialogStackContext';

/** The static tooltip-layer token used outside any dialog. */
const TOOLTIP_ZINDEX_TOKEN = 'var(--cratis-z-index-tooltip)';

/**
 * Resolves the z-index, as a CSS expression, that an adapter-owned tooltip popup must use so it
 * stays above its owning dialog, including nested dialogs. Outside a dialog it is the static
 * `--cratis-z-index-tooltip` token. Both forms stay relative to the application's token overrides.
 */
const useTooltipZIndex = (): string => {
    const nearestDialogZIndex = useNearestDialogZIndex();
    return nearestDialogZIndex === null
        ? TOOLTIP_ZINDEX_TOKEN
        : zIndexAboveDialog(nearestDialogZIndex, TOOLTIP_OFFSET);
};

/** @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it. */
export const unstable_useTooltipZIndex: () => string = useTooltipZIndex;
