// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import {
    CanvasItemRegistryContext,
    type CanvasItemRegistryEntry,
} from '../Canvas';
import { CanvasItem } from '../CanvasItem';

// An id-less CanvasItem must still register — the minimap and fit-to-content read straight off the
// registry regardless of id — but the entry it registers has to say "anonymous" so a Region reading
// the same registry knows never to report it as a member (see regionContainment.ts).

describe('when no explicit id is given', () => {
    let root: Root;
    let container: HTMLDivElement;
    const registered: Array<[string, CanvasItemRegistryEntry]> = [];
    const unregistered: string[] = [];

    beforeEach(async () => {
        registered.length = 0;
        unregistered.length = 0;

        // SAFETY: jsdom omits ResizeObserver; CanvasItem only calls the observer methods below, and
        // performs its own explicit initial measurement independently of the callback firing.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };

        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CanvasItemRegistryContext.Provider
                    value={{
                        register: (id, entry) => registered.push([id, entry]),
                        unregister: (id) => unregistered.push(id),
                    }}
                >
                    <CanvasItem x={10} y={20}>
                        <div>Anonymous item</div>
                    </CanvasItem>
                </CanvasItemRegistryContext.Provider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should still register in the Canvas item registry', () =>
        expect(registered).to.have.length(1));

    it('should mark the registered entry anonymous', () =>
        expect(registered[0][1].anonymous).to.equal(true));

    it('should register under a generated key, not an empty one', () =>
        expect(registered[0][0]).to.be.a('string').and.not.be.empty);

    it('should report the measured world-space position', () => {
        expect(registered[0][1].x).to.equal(10);
        expect(registered[0][1].y).to.equal(20);
    });

    it('should unregister the same generated key on unmount', async () => {
        const generatedId = registered[0][0];
        await act(async () => root.unmount());
        expect(unregistered).to.contain(generatedId);
    });
});
