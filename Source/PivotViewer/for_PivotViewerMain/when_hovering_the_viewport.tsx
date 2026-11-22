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

describe('when hovering a card', () => {
    it('should show the pointer cursor', () => {
        context.render();
        context.hover(0, 10).should.equal('pointer');
    });
});

describe('when hovering the background after a card', () => {
    it('should show the default cursor', () => {
        context.render();
        context.hover(0, 10);
        context.hover(65, 10).should.equal('default');
    });
});

describe('when hovering a card while zooming', () => {
    it('should leave the cursor alone', () => {
        context.render({ isZooming: true });
        context.hover(0, 10).should.equal('');
    });
});
