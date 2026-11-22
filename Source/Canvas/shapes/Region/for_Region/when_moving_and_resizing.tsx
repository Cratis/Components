// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { should } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { unmountPrimitive } from '../../../../Common/for_Primitives/given/a_primitive_dom';
import { mountRegion, pointAt } from './given/a_region';

should();

describe('when moving and resizing a region', () => {
    let mounted: Awaited<ReturnType<typeof mountRegion>>;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        vi.restoreAllMocks();
    });

    it('should leave body gestures alone and select before moving from the title at effective zoom', async () => {
        const callbacks: unknown[][] = [];
        mounted = await mountRegion({
            onSelect: (...args) => callbacks.push(['select', ...args]),
            onMove: (...args) => callbacks.push(['move', ...args]),
            onMoveEnd: (...args) => callbacks.push(['end', ...args]),
        });
        vi.spyOn(mounted.element, 'getBoundingClientRect').mockReturnValue({ width: 400 } as DOMRect);
        await pointAt(mounted.element, 'pointerdown');
        await pointAt(mounted.element, 'pointermove', { clientX: 50 });
        callbacks.should.deep.equal([]);
        await pointAt(mounted.title, 'pointerdown', { clientX: 100, clientY: 100, ctrlKey: true });
        await pointAt(mounted.element, 'pointermove', { clientX: 140, clientY: 160, buttons: 0 });
        await pointAt(mounted.element, 'pointermove', { clientX: 140, clientY: 160 });
        await pointAt(mounted.element, 'pointerup');
        await pointAt(mounted.element, 'pointercancel');
        callbacks.should.deep.equal([
            ['select', 'sample-region', true], ['move', 'sample-region', 30, 50], ['end', 'sample-region'],
        ]);
    });

    it('should resize each edge and corner while anchoring the opposite edges', async () => {
        mounted = await mountRegion();
        const bounds = [
            [30, 50, 180, 130], [10, 50, 200, 130], [10, 50, 220, 130], [10, 20, 220, 160],
            [10, 20, 220, 190], [10, 20, 200, 190], [30, 20, 180, 190], [30, 20, 180, 160],
        ];
        for (const [index, handle] of mounted.handles.entries()) {
            await pointAt(handle, 'pointerdown');
            await pointAt(handle, 'pointermove', { clientX: 20, clientY: 30 });
            await pointAt(handle, 'pointerup');
            vi.mocked(mounted.props.onResize).mock.lastCall!.should.deep.equal(['sample-region', ...bounds[index]]);
        }
        vi.mocked(mounted.props.onResizeEnd!).mock.calls.should.have.lengthOf(8);
        vi.mocked(mounted.props.onSelect).mock.calls.should.deep.equal([]);
        vi.mocked(mounted.props.onMove).mock.calls.should.deep.equal([]);
    });

    it('should clamp northwest resizing to one hundred and finish cancellation only once', async () => {
        mounted = await mountRegion();
        await pointAt(mounted.handles[0], 'pointerdown', { clientX: 10, clientY: 20 });
        await pointAt(mounted.handles[0], 'pointermove', { clientX: 500, clientY: 500 });
        await pointAt(mounted.handles[0], 'pointercancel');
        await pointAt(mounted.handles[0], 'pointerup');
        vi.mocked(mounted.props.onResize).mock.calls.should.deep.equal([['sample-region', 110, 80, 100, 100]]);
        vi.mocked(mounted.props.onResizeEnd!).mock.calls.should.deep.equal([['sample-region']]);
    });
});
