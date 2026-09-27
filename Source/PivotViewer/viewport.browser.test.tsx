// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRoot } from 'react-dom/client';
import { cdp, page, userEvent } from 'vitest/browser';
import axe from 'axe-core';
import { composeStory } from '@storybook/react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { waitFor } from 'storybook/test';
import meta, { KeyboardScrollableViewport } from './PivotViewer.stories';
import '../tokens.css';
import '../theme.css';
import '../.storybook/preview.css';
import './PivotViewer.css';

const Story = composeStory(KeyboardScrollableViewport, meta);
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(async () => {
    await page.viewport(1024, 768);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(() => {
    root.unmount();
    host.remove();
    document.documentElement.classList.remove('cratis-light', 'cratis-dark');
});

it('scrolls the overflowing Storybook card area with trusted keys and tabs out', async () => {
    root.render(<Story />);
    await waitFor(() => expect(host.querySelector('.pv-viewport')).not.toBeNull());
    const viewport = host.querySelector<HTMLDivElement>('.pv-viewport')!;
    const lastControl = host.querySelector<HTMLSelectElement>('.pv-dimension-select select')!;
    const exit = host.querySelector<HTMLButtonElement>('.storybook-wrapper > button')!;

    await waitFor(() => expect(viewport.scrollHeight - viewport.clientHeight).toBeGreaterThan(500));
    await waitForRenderedCanvas(viewport);
    await userEvent.click(exit);
    lastControl.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(viewport);
    expect(viewport.matches(':focus-visible')).toBe(true);
    // An inset 3px ring is painted within the viewport bounds, not clipped by .pv-main.
    document.documentElement.classList.add('cratis-light');
    expect(getComputedStyle(viewport).boxShadow).toContain('rgb(37, 99, 235)');
    expect(getComputedStyle(viewport).boxShadow).toContain('3px inset');
    document.documentElement.classList.remove('cratis-light');
    document.documentElement.classList.add('cratis-dark');
    expect(getComputedStyle(viewport).boxShadow).toContain('rgb(147, 197, 253)');
    expect(getComputedStyle(viewport).boxShadow).toContain('3px inset');

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo({ top: maxScrollTop, behavior: 'instant' });
    expect(viewport.scrollTop).toBe(maxScrollTop);
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(viewport.scrollTop).toBeLessThan(maxScrollTop));
    const afterArrow = viewport.scrollTop;
    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(afterArrow));
    await userEvent.tab();
    expect(document.activeElement).not.toBe(viewport);
    const results = await axe.run(host, { runOnly: ['scrollable-region-focusable'] });
    expect(results.violations).toHaveLength(0);
});

// Read actual painted pixels rather than computed shadow/outline: the Pixi canvas is a
// sibling above the scrollable viewport, and can conceal a perfectly valid CSS ring.
async function capturePixels(viewport: HTMLDivElement) {
    const screenshot = await page.elementLocator(viewport).screenshot({ save: false });
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${screenshot}`)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return context.getImageData(0, 0, canvas.width, canvas.height);
}

// The scroll spacer can be ready before Pixi has attached or painted its canvas.
// Compare interior pixels with the canvas hidden to require a real rendered card frame.
async function waitForRenderedCanvas(viewport: HTMLDivElement) {
    await waitFor(() => {
        const canvas = host.querySelector<HTMLCanvasElement>('.pv-viewport ~ canvas');
        expect(canvas?.width).toBeGreaterThan(0);
        expect(canvas?.height).toBeGreaterThan(0);
    });
    const canvas = host.querySelector<HTMLCanvasElement>('.pv-viewport ~ canvas')!;
    await waitFor(async () => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const painted = await capturePixels(viewport);
        canvas.style.visibility = 'hidden';
        let withoutCanvas: ImageData;
        try {
            withoutCanvas = await capturePixels(viewport);
        } finally {
            canvas.style.visibility = '';
        }
        let changed = 0;
        for (let y = 16; y < painted.height - 16; y += 12) {
            for (let x = 16; x < painted.width - 16; x += 12) {
                const offset = (y * painted.width + x) * 4;
                if (Math.abs(painted.data[offset] - withoutCanvas.data[offset]) +
                    Math.abs(painted.data[offset + 1] - withoutCanvas.data[offset + 1]) +
                    Math.abs(painted.data[offset + 2] - withoutCanvas.data[offset + 2]) > 30) changed++;
            }
        }
        expect(changed, 'Pixi canvas must paint cards before edge sampling').toBeGreaterThan(8);
    }, { timeout: 15000 });
}

async function edgePixels(viewport: HTMLDivElement, edge: 'top' | 'bottom' | 'left', color: readonly number[]) {
    const { data, width, height } = await capturePixels(viewport);
    const count = edge === 'left' ? height : width;
    let matching = 0;
    for (let index = 8; index < count - 8; index++) {
        const x = edge === 'left' ? 1 : index;
        const y = edge === 'top' ? 1 : edge === 'bottom' ? height - 3 : index;
        const offset = (y * width + x) * 4;
        if (color.every((channel, channelIndex) => Math.abs(data[offset + channelIndex] - channel) <= 8)) matching++;
    }
    return { matching, total: count - 16 };
}

it('paints the focus ring above cards at nonzero vertical and horizontal scroll', async () => {
    root.render(<Story />);
    await waitFor(() => expect(host.querySelector('.pv-viewport')).not.toBeNull());
    const viewport = host.querySelector<HTMLDivElement>('.pv-viewport')!;
    const lastControl = host.querySelector<HTMLSelectElement>('.pv-dimension-select select')!;
    await waitFor(() => expect(viewport.scrollHeight - viewport.clientHeight).toBeGreaterThan(500));
    await waitForRenderedCanvas(viewport);
    lastControl.focus();
    await userEvent.tab();
    expect(viewport.matches(':focus-visible')).toBe(true);

    viewport.scrollTo({ top: 250, behavior: 'instant' });
    expect(viewport.scrollTop).toBeGreaterThan(0);
    for (const [theme, color] of [
        ['cratis-light', [37, 99, 235]],
        ['cratis-dark', [147, 197, 253]],
    ] as const) {
        document.documentElement.classList.remove('cratis-light', 'cratis-dark');
        document.documentElement.classList.add(theme);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        for (const edge of ['top', 'bottom'] as const) {
            const pixels = await edgePixels(viewport, edge, color);
            expect(pixels.matching / pixels.total, `${theme} ${edge}: ${pixels.matching}/${pixels.total} ring pixels`).toBeGreaterThan(0.8);
        }
    }

    // A theme's focus color drives both the inset shadow and the visible canvas outline.
    document.documentElement.style.setProperty('--cratis-focus-color', '#fca5a5');
    try {
        expect(getComputedStyle(viewport).boxShadow).toContain('rgb(252, 165, 165)');
        const custom = await edgePixels(viewport, 'top', [252, 165, 165]);
        expect(custom.matching / custom.total).toBeGreaterThan(0.8);
    } finally {
        document.documentElement.style.removeProperty('--cratis-focus-color');
    }

    await userEvent.click(host.querySelector<HTMLButtonElement>('.pv-view-toggle button:nth-child(2)')!);
    await waitFor(() => expect(viewport.scrollWidth - viewport.clientWidth).toBeGreaterThan(100));
    await waitForRenderedCanvas(viewport);
    lastControl.focus();
    await userEvent.tab();
    expect(viewport.matches(':focus-visible')).toBe(true);
    viewport.scrollTo({ left: 150, behavior: 'instant' });
    expect(viewport.scrollLeft).toBeGreaterThan(0);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const pixels = await edgePixels(viewport, 'left', [147, 197, 253]);
    expect(pixels.matching / pixels.total, `grouped left: ${pixels.matching}/${pixels.total} ring pixels`).toBeGreaterThan(0.8);
    const pixiCanvas = host.querySelector<HTMLCanvasElement>('.pv-viewport ~ canvas')!;
    expect(getComputedStyle(pixiCanvas).pointerEvents).toBe('none');

    const session = cdp() as unknown as { send(method: string, params: object): Promise<void> };
    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
    try {
        await waitFor(() => expect(matchMedia('(forced-colors: active)').matches).toBe(true));
        expect(getComputedStyle(pixiCanvas).outlineStyle).toBe('solid');
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const focused = await capturePixels(viewport);
        host.querySelector<HTMLButtonElement>('.storybook-wrapper > button')!.focus();
        expect(viewport.matches(':focus-visible')).toBe(false);
        const blurred = await capturePixels(viewport);
        expect(blurred.width).toBe(focused.width);
        expect(blurred.height).toBe(focused.height);
        let changed = 0;
        for (let y = 8; y < focused.height - 8; y++) {
            const offset = (y * focused.width + 1) * 4;
            if (Math.abs(focused.data[offset] - blurred.data[offset]) +
                Math.abs(focused.data[offset + 1] - blurred.data[offset + 1]) +
                Math.abs(focused.data[offset + 2] - blurred.data[offset + 2]) > 30) changed++;
        }
        const total = focused.height - 16;
        expect(changed / total, `forced colors left: ${changed}/${total} visibly changed pixels`).toBeGreaterThan(0.8);
    } finally {
        await session.send('Emulation.setEmulatedMedia', { features: [] });
    }
});
