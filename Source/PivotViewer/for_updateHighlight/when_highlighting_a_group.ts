// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { vi } from 'vitest';
import { updateHighlight } from '../components/pivot/groups';
import { a_grouped_layout } from '../for_updateGroupBackgrounds/given/a_grouped_layout';

describe('when highlighting a group', () => {
    let context: a_grouped_layout;

    beforeEach(() => {
        context = new a_grouped_layout();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        context.root.destroy({ children: true });
    });

    const highlight = (index: number | null = 0, zoom = 0.5) => updateHighlight(context.root,
        context.container, context.grouping, context.layout, index, 20, zoom);

    it('should reuse the highlight with explicit geometry and zoomed height', () => {
        const rect = vi.spyOn(context.highlight, 'rect');
        const fill = vi.spyOn(context.highlight, 'fill');
        highlight();
        rect.mock.calls.should.deep.equal([[10, -200, 40, 800]]);
        fill.mock.calls.should.deep.equal([[0xffffff]]);
        context.highlight.alpha.should.equal(0.05);
        context.highlight.visible.should.be.true;
        context.root.children.should.have.lengthOf(1);
    });

    it('should fall back to item bounds including card width and tolerate zero zoom', () => {
        context.layout.bucketWidths = undefined;
        context.layout.groupXs = undefined;
        context.grouping.groups[0].ids = Uint32Array.of(0, 1);
        const rect = vi.spyOn(context.highlight, 'rect');
        highlight(0, 0);
        rect.mock.calls.should.deep.equal([[10, -200, 60, 600]]);
    });

    it('should hide a cleared highlight for absent invalid empty or unpositioned groups', () => {
        const clear = vi.spyOn(context.highlight, 'clear');
        for (const index of [null, -1, 10]) {
            context.highlight.visible = true;
            highlight(index);
            context.highlight.visible.should.be.false;
        }
        context.grouping.groups[0].ids = new Uint32Array();
        highlight();
        context.highlight.visible.should.be.false;
        context.grouping.groups[0].ids = Uint32Array.of(99);
        context.layout.bucketWidths = undefined;
        highlight();
        context.highlight.visible.should.be.false;
        clear.mock.calls.should.have.lengthOf(5);
    });

    it('should create the highlight on demand but leave existing graphics alone without a viewport', () => {
        context.root.removeChild(context.highlight);
        highlight();
        context.root.children[0].label.should.equal('highlight');
        const clear = vi.spyOn(context.root.children[0] as PIXI.Graphics, 'clear');
        updateHighlight(context.root, null, context.grouping, context.layout, 0, 20, 1);
        clear.mock.calls.should.have.lengthOf(0);
        context.highlight.destroy();
    });
});
