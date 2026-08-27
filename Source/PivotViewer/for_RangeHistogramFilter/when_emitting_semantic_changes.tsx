// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { RangeHistogramFilter } from '../components/RangeHistogramFilter';

describe('when emitting semantic PivotViewer range changes', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(async () => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should emit semantic values with native user metadata', async () => {
        const onChange = vi.fn();
        await act(async () => {
            root.render(
                <RangeHistogramFilter
                    values={[10, 20, 30, 40]}
                    min={0}
                    max={40}
                    buckets={4}
                    selectedRange={[10, 30]}
                    onChange={onChange}
                />,
            );
        });

        const firstBucket = container.querySelector<HTMLButtonElement>('.pv-histogram-bar');
        const clear = container.querySelector<HTMLButtonElement>('.pv-range-clear');
        if (!firstBucket || !clear) {
            throw new Error('PivotViewer range controls were not rendered.');
        }

        await act(async () => firstBucket.click());
        await act(async () => clear.click());

        expect(onChange.mock.calls).to.have.lengthOf(2);
        expect(onChange.mock.calls[0][0]).to.deep.equal([0, 10]);
        expect(onChange.mock.calls[1][0]).to.equal(null);
        for (const call of onChange.mock.calls) {
            expect(call[1]).to.include({ source: 'user' });
            expect(call[1].nativeEvent).to.be.instanceOf(Event);
            expect(Object.hasOwn(call[1].nativeEvent, 'nativeEvent')).to.equal(false);
        }
    });
});
