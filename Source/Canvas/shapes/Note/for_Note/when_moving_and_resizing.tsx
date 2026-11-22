// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { unmountPrimitive } from '../../../../Common/for_Primitives/given/a_primitive_dom';
import { mountNote, pointAt } from './given/a_note';

describe('when moving and resizing a note', () => {
    let mounted: Awaited<ReturnType<typeof mountNote>>;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        vi.restoreAllMocks();
    });

    it('should select additively and move in world coordinates at the effective zoom', async () => {
        mounted = await mountNote();
        vi.spyOn(mounted.element, 'getBoundingClientRect').mockReturnValue({ width: 400 } as DOMRect);
        await pointAt(mounted.element, 'pointerdown', { clientX: 100, clientY: 100, shiftKey: true });
        await pointAt(mounted.element, 'pointermove', { clientX: 140, clientY: 160 });
        await pointAt(mounted.element, 'pointerup');
        await pointAt(mounted.element, 'pointercancel');
        expect(mounted.props.onSelect).toHaveBeenCalledExactlyOnceWith('sample-note', true);
        expect(mounted.props.onMove).toHaveBeenCalledExactlyOnceWith('sample-note', 30, 50);
        expect(mounted.props.onMoveEnd).toHaveBeenCalledExactlyOnceWith('sample-note');
    });

    it('should ignore movement without pressed buttons or an active drag', async () => {
        mounted = await mountNote();
        await pointAt(mounted.element, 'pointermove', { clientX: 50 });
        await pointAt(mounted.element, 'pointerdown');
        await pointAt(mounted.element, 'pointermove', { clientX: 50, buttons: 0 });
        expect(mounted.props.onMove).not.toHaveBeenCalled();
    });

    it('should keep the opposite edges anchored when northwest resizing hits the minimum', async () => {
        mounted = await mountNote();
        await pointAt(mounted.handles[0], 'pointerdown', { clientX: 10, clientY: 20 });
        await pointAt(mounted.handles[0], 'pointermove', { clientX: 500, clientY: 500 });
        await pointAt(mounted.handles[0], 'pointercancel');
        await pointAt(mounted.handles[0], 'pointerup');
        expect(mounted.props.onResize).toHaveBeenCalledExactlyOnceWith('sample-note', 130, 100, 80, 80);
        expect(mounted.props.onResizeEnd).toHaveBeenCalledExactlyOnceWith('sample-note');
        expect(mounted.props.onSelect).not.toHaveBeenCalled();
        expect(mounted.props.onMove).not.toHaveBeenCalled();
    });

    it('should resize every edge and corner without moving unaffected edges', async () => {
        mounted = await mountNote();
        const bounds = [
            [30, 50, 180, 130], [10, 50, 200, 130], [10, 50, 220, 130], [10, 20, 220, 160],
            [10, 20, 220, 190], [10, 20, 200, 190], [30, 20, 180, 190], [30, 20, 180, 160],
        ];
        for (const [index, handle] of mounted.handles.entries()) {
            await pointAt(handle, 'pointerdown');
            await pointAt(handle, 'pointermove', { clientX: 20, clientY: 30 });
            await pointAt(handle, 'pointerup');
            expect(mounted.props.onResize).toHaveBeenLastCalledWith('sample-note', ...bounds[index]);
        }
        expect(mounted.props.onResizeEnd).toHaveBeenCalledTimes(8);
    });
});
