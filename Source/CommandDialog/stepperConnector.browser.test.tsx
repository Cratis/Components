// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/// <reference types="vite/client" />
import { createRoot } from 'react-dom/client';
import { composeStory } from '@storybook/react';
import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { waitFor } from 'storybook/test';
import meta, { FiveStepsWithLongNames } from './CommandStepper.stories';
import stepperStyles from './CommandStepper.css?raw';
import '../tokens.css';
import '../theme.css';

const Story = composeStory(FiveStepsWithLongNames, meta);

// The published stylesheet puts component rules in the `cratis-components` cascade layer, so any
// unlayered product rule wins. Mirror that here, and add a product rule that undoes label clipping.
const componentLayer = `@layer cratis-components {\n${stepperStyles}\n}`;
const productOverridesLabelClipping = 'span { overflow: visible; text-overflow: clip; white-space: nowrap; }';

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(async () => {
    await page.viewport(1200, 800);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(() => {
    root.unmount();
    host.remove();
});

const render = async (width: number, productStyles: string) => {
    root.render(
        <div style={{ width }}>
            <style>{componentLayer}</style>
            <style>{productStyles}</style>
            <Story />
        </div>,
    );
    await waitFor(() => expect(host.querySelectorAll('.cratis-command-stepper__separator')).toHaveLength(4));
    const all = (part: string) => [...host.querySelectorAll<HTMLElement>(`.cratis-command-stepper__${part}`)];
    return { titles: all('title'), markers: all('number'), separators: all('separator') };
};

/** The area the label's text paints into, including any text overflowing an unclipped box. */
const inkOf = (title: HTMLElement) => {
    const box = title.getBoundingClientRect();
    return { left: box.left, right: box.left + Math.max(box.width, title.scrollWidth), top: box.top, bottom: box.bottom };
};

const overlaps = (first: { left: number; right: number; top: number; bottom: number }, second: DOMRect) =>
    first.left < second.right && second.left < first.right && first.top < second.bottom && second.top < first.bottom;

const tolerance = 0.5;

for (const [scenario, productStyles] of [['without product styles', ''], ['when product styles undo label clipping', productOverridesLabelClipping]]) {
    describe(`horizontal stepper connector ${scenario}`, () => {
        for (const width of [770, 360]) {
            it(`keeps every connector off every label at ${width}px`, async () => {
                const { titles, separators } = await render(width, productStyles);
                for (const separator of separators) {
                    const line = separator.getBoundingClientRect();
                    expect(line.width).toBeGreaterThan(0);
                    for (const title of titles) {
                        expect(overlaps(inkOf(title), line), `"${title.textContent}" is crossed by a connector`).toBe(false);
                        expect(line.bottom).toBeLessThanOrEqual(title.getBoundingClientRect().top + tolerance);
                    }
                }
            });

            it(`ends every connector at the marker edges at ${width}px`, async () => {
                const { markers, separators } = await render(width, productStyles);
                separators.forEach((separator, index) => {
                    const line = separator.getBoundingClientRect();
                    const from = markers[index].getBoundingClientRect();
                    const to = markers[index + 1].getBoundingClientRect();
                    expect(line.left).toBeGreaterThanOrEqual(from.right - tolerance);
                    expect(line.right).toBeLessThanOrEqual(to.left + tolerance);
                    expect(line.top).toBeGreaterThanOrEqual(from.top);
                    expect(line.bottom).toBeLessThanOrEqual(from.bottom);
                });
            });
        }
    });
}

it('shows every step name in full in a dialog-wide horizontal stepper', async () => {
    const { titles } = await render(770, '');
    for (const title of titles) {
        expect(title.scrollWidth, `"${title.textContent}" is truncated`).toBeLessThanOrEqual(title.clientWidth + 1);
    }
});
