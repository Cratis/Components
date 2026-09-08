// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CanvasItemRegistryContext, type CanvasItemRegistryEntry } from '../Canvas';
import { CanvasItem } from '../CanvasItem';

// A caller-chosen id is the opt-in that makes an item addressable by a Region's containment
// reports — the registered entry must therefore carry it as the registry key and must not be
// marked anonymous.

describe('when an explicit id is given', () => {
    let root: Root;
    let container: HTMLDivElement;
    const registered: Array<[string, CanvasItemRegistryEntry]> = [];

    beforeEach(async () => {
        registered.length = 0;

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
                        unregister: () => undefined,
                    }}
                >
                    <CanvasItem id='member-a' x={40} y={60}>
                        <div>Named item</div>
                    </CanvasItem>
                </CanvasItemRegistryContext.Provider>,
            );
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should register under the caller-chosen id', () => {
        expect(registered).to.have.length(1);
        expect(registered[0][0]).to.equal('member-a');
    });

    it('should not mark the registered entry anonymous', () =>
        expect(registered[0][1].anonymous).to.equal(false));

    it('should report the measured world-space position', () => {
        expect(registered[0][1].x).to.equal(40);
        expect(registered[0][1].y).to.equal(60);
    });
});
