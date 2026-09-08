// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { RangeHistogramFilter } from '../RangeHistogramFilter';

describe('when rendering RangeHistogramFilter state attributes', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await render([20, 40]);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    const render = async (selectedRange: [number, number] | null) => {
        await act(async () => {
            root.render(
                <RangeHistogramFilter
                    values={[10, 20, 30, 40, 50, 60, 70, 80, 90]}
                    min={0}
                    max={100}
                    buckets={10}
                    selectedRange={selectedRange}
                    onChange={() => undefined}
                />,
            );
        });
    };

    it('should expose selected state on the range and its endpoints', () => {
        const histogram = container.querySelector('.pv-range-histogram');
        const slider = container.querySelector('.pv-range-slider');
        const selection = container.querySelector('.pv-range-selection');
        const handles = container.querySelectorAll('.pv-range-handle');

        expect(histogram?.getAttribute('data-selected')).to.equal('true');
        expect(slider?.getAttribute('data-selected')).to.equal('true');
        expect(selection?.getAttribute('data-selected')).to.equal('true');
        expect(handles[0].getAttribute('data-selected')).to.equal('true');
        expect(handles[1].getAttribute('data-selected')).to.equal('true');
    });

    it('should expose selected state only on intersecting histogram bars', () => {
        const bars = Array.from(
            container.querySelectorAll<HTMLButtonElement>('.pv-histogram-bar'),
        );
        const selectedBars = bars.filter((bar) => bar.hasAttribute('data-selected'));
        const unselectedBars = bars.filter((bar) => !bar.hasAttribute('data-selected'));

        expect(selectedBars.length).to.be.greaterThan(0);
        expect(unselectedBars.length).to.be.greaterThan(0);
        for (const bar of selectedBars) {
            expect(bar.getAttribute('data-selected')).to.equal('true');
        }
    });

    it('should expose pressed state while a range handle is being dragged', async () => {
        const minimum = container.querySelector<HTMLElement>(
            '.pv-range-handle-left',
        )!;

        await act(async () => {
            minimum.dispatchEvent(
                new MouseEvent('mousedown', { bubbles: true, clientX: 20 }),
            );
        });

        expect(minimum.getAttribute('data-pressed')).to.equal('true');
        expect(
            container
                .querySelector('.pv-range-handle-right')
                ?.hasAttribute('data-pressed'),
        ).to.equal(false);

        await act(async () => {
            document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });
    });

    it('should omit selection when no range is selected', async () => {
        await render(null);

        expect(container.querySelector('[data-selected]')).to.equal(null);
    });

    it('should omit disabled state because every rendered range control is enabled', () => {
        expect(container.querySelector('[data-disabled]')).to.equal(null);
    });

    it('should never serialize false state attributes', () => {
        expect(container.querySelector('[data-selected="false"]')).to.equal(null);
        expect(container.querySelector('[data-pressed="false"]')).to.equal(null);
        expect(container.querySelector('[data-disabled="false"]')).to.equal(null);
    });
});
