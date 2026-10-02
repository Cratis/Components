// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { renderedPreviews, twoLibraryCatalog } from './given/a_synthetic_catalog';
import { open, renderPicker, tileNamed, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

describe('when previews are lazy', () => {
    let picker: PickerInTheDom;
    const observed = new Map<Element, ObserverCallback>();
    const original = globalThis.IntersectionObserver;

    beforeEach(async () => {
        renderedPreviews.length = 0;
        observed.clear();
        // SAFETY: a minimal observer that records what is watched; jsdom has no IntersectionObserver.
        globalThis.IntersectionObserver = class {
            constructor(private readonly callback: ObserverCallback) {}
            observe(element: Element) {
                observed.set(element, this.callback);
            }
            disconnect() {
                /* nothing to release */
            }
        } as unknown as typeof IntersectionObserver;
        picker = await renderPicker({ catalog: twoLibraryCatalog() });
        renderedPreviews.length = 0;
        await open(picker);
    });

    afterEach(async () => {
        await unmount(picker);
        globalThis.IntersectionObserver = original;
    });

    it('should draw no preview before a tile nears the viewport', () => renderedPreviews.should.be.empty);

    describe('and a tile scrolls into view', () => {
        beforeEach(async () => {
            const tile = tileNamed('Map')!;
            await act(async () => observed.get(tile)!([{ isIntersecting: true }]));
        });

        it('should draw that tile only', () => renderedPreviews.should.deep.equal(['example-glyphs/map']));
        it('should put the glyph in the icon area', () =>
            (tileNamed('Map')!.querySelector('[data-cratis-part="tileIcon"] [data-glyph]') !== null).should.be.true);
    });
});
