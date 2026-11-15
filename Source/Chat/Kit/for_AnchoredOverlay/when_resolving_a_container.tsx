// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect, vi } from 'vitest';
import { Overlay, render, unmount } from './given/an_overlay_in_the_dom';

describe('when resolving an anchored overlay container', () => {
    it('should use the body without a provider environment', async () => {
        const mounted = await render(<Overlay />);
        try {
            expect(document.querySelector('[data-picker]')?.parentElement?.parentElement).toBe(document.body);
        } finally { await unmount(mounted); }
    });

    it('should use the provider target instead of the body', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const mounted = await render(<Overlay environment={{ getContainer: () => target }} />);
        try {
            expect(target.querySelector('[data-picker]')).not.toBeNull();
        } finally { await unmount(mounted); target.remove(); }
    });

    it('should defer a null target until a later render makes it available', async () => {
        const target = document.createElement('div');
        document.body.append(target);
        const getContainer = vi.fn<() => HTMLElement | null>(() => null);
        const environment = { getContainer };
        const mounted = await render(<Overlay open={false} environment={environment} />);
        try {
            expect(getContainer).not.toHaveBeenCalled();
            await act(async () => mounted.root.render(<Overlay environment={environment} />));
            expect(document.querySelector('[data-picker]')).toBeNull();
            getContainer.mockReturnValue(target);
            await act(async () => mounted.root.render(<Overlay environment={environment} />));
            expect(target.querySelector('[data-picker]')).not.toBeNull();
        } finally { await unmount(mounted); target.remove(); }
    });
});
