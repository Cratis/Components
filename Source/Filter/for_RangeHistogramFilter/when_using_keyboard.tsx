// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { RangeHistogramFilter } from '../RangeHistogramFilter';

const Harness = () => {
    const [range, setRange] = useState<[number, number] | null>([20, 80]);
    return (
        <RangeHistogramFilter
            values={[10, 20, 30, 40, 50, 60, 70, 80, 90]}
            min={0}
            max={100}
            buckets={10}
            selectedRange={range}
            onChange={setRange}
            minimumAriaLabel='Minimum order value'
            maximumAriaLabel='Maximum order value'
        />
    );
};

describe('when using the range histogram with a keyboard', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => root.render(<Harness />));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should expose both handles as named sliders', () => {
        const sliders = container.querySelectorAll('[role="slider"]');
        expect(sliders).to.have.length(2);
        expect(sliders[0].getAttribute('aria-label')).to.equal('Minimum order value');
        expect(sliders[1].getAttribute('aria-label')).to.equal('Maximum order value');
    });

    it('should move the minimum by one bucket with ArrowRight', async () => {
        const minimum = container.querySelector<HTMLElement>(
            '[role="slider"][aria-label="Minimum order value"]',
        )!;
        await act(async () => {
            minimum.focus();
            minimum.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
            );
        });

        const values = [...container.querySelectorAll('.pv-range-value')].map(
            (element) => element.textContent,
        );
        expect(values).to.deep.equal(['30', '80']);
        expect(minimum.getAttribute('aria-valuenow')).to.equal('30');
    });
});
