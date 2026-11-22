// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { should } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { CanvasItemRegistryContext } from '../../../CanvasItemRegistryContext';
import type { CanvasItemRegistryContextValue } from '../../../CanvasItemRegistryContextValue';
import type { CanvasItemRegistryEntry } from '../../../CanvasItemRegistryEntry';
import { mountPrimitive, unmountPrimitive } from '../../../../Common/for_Primitives/given/a_primitive_dom';
import { Region } from '../Region';
import { ItemAddedToRegion } from '../ItemAddedToRegion';
import { ItemRemovedFromRegion } from '../ItemRemovedFromRegion';

const { publish } = vi.hoisted(() => ({ publish: vi.fn() }));
vi.mock('../../../../Common/messaging/useOptionalMessenger', () => ({ useOptionalMessenger: () => publish }));
should();

describe('when observing region membership', () => {
    let mounted: Awaited<ReturnType<typeof mountPrimitive>>;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        publish.mockClear();
    });

    it('should publish transitions from snapshots and region bounds, never removals on unmount', async () => {
        let snapshot: ReadonlyMap<string, CanvasItemRegistryEntry> = new Map([
            ['sample-item', { x: 10, y: 10, width: 20, height: 20 }],
        ]);
        const listeners = new Set<() => void>();
        const registry: CanvasItemRegistryContextValue = {
            register: vi.fn(), unregister: vi.fn(), getSnapshot: () => snapshot,
            subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
        };
        const render = (x: number) => (
            <CanvasItemRegistryContext.Provider value={registry}>
                <Region region={{ id: 'sample-region', x, y: 0, width: 100, height: 100, name: 'Example Region' }}
                    selected={false} onSelect={vi.fn()} onMove={vi.fn()} onResize={vi.fn()} onNameChange={vi.fn()} />
            </CanvasItemRegistryContext.Provider>
        );
        mounted = await mountPrimitive(render(0));
        publish.mock.calls.should.deep.equal([[new ItemAddedToRegion('sample-region', 'sample-item')]]);
        await act(async () => { listeners.forEach(listener => listener()); });
        publish.mock.calls.should.have.lengthOf(1);
        await act(async () => { mounted.root.render(render(200)); });
        publish.mock.calls[1].should.deep.equal([new ItemRemovedFromRegion('sample-region', 'sample-item')]);
        snapshot = new Map([['sample-item', { x: 210, y: 10, width: 20, height: 20 }]]);
        await act(async () => { listeners.forEach(listener => listener()); });
        publish.mock.calls[2].should.deep.equal([new ItemAddedToRegion('sample-region', 'sample-item')]);
        await act(async () => { mounted.root.render(null); });
        listeners.size.should.equal(0);
        publish.mock.calls.should.have.lengthOf(3);
    });

    it('should render without a registry or optional callbacks', async () => {
        mounted = await mountPrimitive(
            <Region region={{ id: 'sample-region', x: 0, y: 0, width: 100, height: 100, name: 'Example Region' }}
                selected={false} onSelect={vi.fn()} onMove={vi.fn()} onResize={vi.fn()} onNameChange={vi.fn()} />,
        );
        publish.mock.calls.should.deep.equal([]);
        mounted.container.querySelectorAll('.canvas-region__handle').length.should.equal(0);
    });
});
