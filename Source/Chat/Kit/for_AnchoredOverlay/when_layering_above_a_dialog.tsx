// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'vitest';
import { dialogZIndexForTier, OVERLAY_OFFSET, zIndexAboveDialog } from '../../../renderer/dialogStack';
import { Overlay, render, unmount } from './given/an_overlay_in_the_dom';

describe('when layering above a dialog', () => {
    it('should remain above the second tier without discarding the dialog token', async () => {
        const layer = dialogZIndexForTier(1);
        const mounted = await render(<Overlay layer={layer} />);
        try {
            const overlay = document.querySelector<HTMLElement>('[data-picker]')!.parentElement!;
            expect(overlay.style.zIndex).toBe(zIndexAboveDialog(layer, OVERLAY_OFFSET));
        } finally { await unmount(mounted); }
    });

    it('should carry anchor tokens including a raised dialog band', async () => {
        const mounted = await render(<Overlay layer={dialogZIndexForTier(1)} anchorStyle={{ '--cratis-z-index-dialog': '10100', '--cratis-surface-overlay': 'rgb(12, 23, 34)' } as React.CSSProperties} />);
        try {
            const overlay = document.querySelector<HTMLElement>('[data-picker]')!.parentElement!;
            expect(overlay.style.getPropertyValue('--cratis-z-index-dialog')).toBe('10100');
            expect(overlay.style.getPropertyValue('--cratis-surface-overlay')).toBe('rgb(12, 23, 34)');
        } finally { await unmount(mounted); }
    });
});
