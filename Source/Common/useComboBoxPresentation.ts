// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId } from 'react';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../renderer/dialogStack';
import { useNearestDialogZIndex } from '../renderer/DialogStackContext';
import type { ComboBoxProps } from './ComboBox';

export const useComboBoxPresentation = (props: ComboBoxProps) => {
    const { id, description, invalid = false, errorMessage, 'aria-describedby': ariaDescribedBy } = props;
    const icon = useCratisIcon();
    const expandIcon = icon('expand', '▾');
    const generatedId = useId();
    const inputId = id ?? `cratis-combobox-${generatedId}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = invalid && errorMessage ? `${inputId}-error` : undefined;
    const describedBy = [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined;
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const nearestDialogZIndex = useNearestDialogZIndex();
    const popoverZIndex = nearestDialogZIndex === null
        ? 'var(--cratis-z-index-overlay)'
        : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);
    return { expandIcon, inputId, descriptionId, errorId, describedBy, overlayEnvironment, popoverZIndex };
};
