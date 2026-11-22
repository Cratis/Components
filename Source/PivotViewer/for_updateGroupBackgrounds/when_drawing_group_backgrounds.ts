// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { vi } from 'vitest';
import { updateGroupBackgrounds } from '../components/pivot/groups';
import { DEFAULT_COLORS } from '../components/pivot/constants';
import { a_grouped_layout } from './given/a_grouped_layout';

describe('when drawing group backgrounds', () => {
    let context: a_grouped_layout;

    beforeEach(() => {
        context = new a_grouped_layout();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        context.root.destroy({ children: true });
    });

    const draw = (viewMode = 'grouped') => updateGroupBackgrounds(context.root,
        context.container, context.grouping, context.layout, 0.5, DEFAULT_COLORS, viewMode);

    it('should stripe even groups using explicit bucket geometry and zoomed viewport height', () => {
        const rect = vi.spyOn(PIXI.Graphics.prototype, 'rect');
        const fill = vi.spyOn(PIXI.Graphics.prototype, 'fill');
        draw();
        rect.mock.calls.should.deep.equal([[10, -1000, 40, 1900], [90, -1000, 40, 1900]]);
        fill.mock.calls.should.deep.equal([[DEFAULT_COLORS.base], [DEFAULT_COLORS.base]]);
        context.root.children[2].should.equal(context.highlight);
        context.root.children.slice(0, 2).map(child => [child.alpha, child.visible]).should.deep.equal([[0.15, true], [0.15, true]]);
    });

    it('should derive fallback widths from positioned items and skip groups without positions', () => {
        context.layout.bucketWidths = undefined;
        context.layout.groupXs = undefined;
        context.grouping.groups[0].ids = Uint32Array.of(0, 1);
        context.layout.positions.delete(2);
        const rect = vi.spyOn(PIXI.Graphics.prototype, 'rect');
        draw();
        rect.mock.calls.should.deep.equal([[10, -1000, 40, 1900]]);
    });

    it('should reuse backgrounds and hide unused ones without hiding the highlight', () => {
        draw();
        const first = context.root.children[0] as PIXI.Graphics;
        const clear = vi.spyOn(first, 'clear');
        context.grouping.groups = context.grouping.groups.slice(0, 1);
        draw();
        clear.mock.calls.should.have.lengthOf(1);
        context.root.children.should.have.lengthOf(3);
        context.root.children[1].visible.should.be.false;
        draw('collection');
        first.visible.should.be.false;
        context.highlight.visible.should.be.true;
    });

    it('should hide backgrounds if the viewport is absent or there are no groups', () => {
        draw();
        updateGroupBackgrounds(context.root, null, context.grouping, context.layout, 1, DEFAULT_COLORS, 'grouped');
        context.root.children[0].visible.should.be.false;
        context.highlight.visible.should.be.true;
        context.grouping.groups = [];
        draw();
        context.root.children[1].visible.should.be.false;
    });
});
