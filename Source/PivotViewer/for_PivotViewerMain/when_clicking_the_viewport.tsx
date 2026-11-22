// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { a_pivot_viewer_main } from './given/a_pivot_viewer_main';

vi.mock('../components/PivotCanvas', () => ({ PivotCanvas: () => null }));
vi.mock('../components/AxisLabels', () => ({ AxisLabels: () => null }));
vi.mock('../components/DetailPanel', () => ({ DetailPanel: () => null }));

let context: a_pivot_viewer_main;

beforeEach(() => { context = new a_pivot_viewer_main(); });
afterEach(() => context.unmount());

describe('when clicking a card in the viewport', () => {
    it('should report the card with the native event and its id', () => {
        context.render({ selected: true });
        const event = context.click(0, 10);
        context.onCardClick.mock.calls.should.deep.equal([[context.data[0], event, 0]]);
        context.onCloseDetail.mock.calls.length.should.equal(0);
    });
});

describe('when clicking the far edge of a card', () => {
    it('should report the card', () => {
        context.render();
        context.click(135, 35);
        context.onCardClick.mock.calls[0][2].should.equal(1);
    });
});

describe('when clicking a card in a zoomed viewport', () => {
    it('should hit test in world coordinates', () => {
        context.render({ zoomLevel: 2 });
        context.click(185, 15);
        context.onCardClick.mock.calls[0][2].should.equal(1);
    });
});

describe('when clicking a visible id without a layout position', () => {
    it('should skip it and keep looking', () => {
        context.render({}, [7, 0]);
        context.click(0, 10);
        context.onCardClick.mock.calls[0][2].should.equal(0);
    });
});

describe('when clicking a card without an item', () => {
    it('should neither report the card nor close the detail', () => {
        context.data = [context.data[0]];
        context.render({ selected: true });
        context.click(90, 10);
        context.onCardClick.mock.calls.length.should.equal(0);
        context.onCloseDetail.mock.calls.length.should.equal(0);
    });
});

describe('when clicking the background with a card selected', () => {
    it('should close the detail', () => {
        context.render({ selected: true });
        context.click(65, 10);
        context.onCardClick.mock.calls.length.should.equal(0);
        context.onCloseDetail.mock.calls.length.should.equal(1);
    });
});

describe('when clicking the background without a card selected', () => {
    it('should do nothing', () => {
        context.render();
        context.click(65, 10);
        context.onCloseDetail.mock.calls.length.should.equal(0);
    });
});

describe('when clicking while zooming', () => {
    it('should ignore the click', () => {
        context.render({ isZooming: true, selected: true });
        context.click(0, 10);
        context.click(65, 10);
        context.onCardClick.mock.calls.length.should.equal(0);
        context.onCloseDetail.mock.calls.length.should.equal(0);
    });
});
