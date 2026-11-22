// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { vi } from 'vitest';
import { clearSpritePool, destroySprite, updateCardContent } from '../components/pivot/sprites';
import type { CardSprite } from '../components/pivot/constants';
import { a_card } from '../for_createCardSprite/given/a_card';

describe('when refreshing card content', () => {
    let context: a_card;
    let sprite: CardSprite;

    beforeEach(() => {
        context = new a_card();
        sprite = context.create();
        // SAFETY: Width is the only measured field consumed by the card fitting helper.
        vi.spyOn(PIXI.CanvasTextMetrics, 'measureText').mockImplementation(text => ({ width: text.length * 10 } as PIXI.CanvasTextMetrics));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        destroySprite(sprite);
        clearSpritePool();
    });

    const refresh = (selectedId: string | number | null = null) => updateCardContent(sprite,
        context.items[0], selectedId, context.width, context.height, context.colors, context.renderer);

    it('should fit title and value text and cache measurements until text or width changes', () => {
        refresh();
        sprite.titleText.text.should.equal('Example C…');
        sprite.labelsText.text.should.equal('Label');
        sprite.valuesText.text.should.equal('Ex…');
        const measurements = vi.mocked(PIXI.CanvasTextMetrics.measureText).mock.calls.length;
        refresh();
        vi.mocked(PIXI.CanvasTextMetrics.measureText).mock.calls.should.have.lengthOf(measurements);
        context.width = 228;
        refresh();
        sprite.titleText.text.should.equal('Example Card');
        sprite.valuesText.text.should.equal('Example Value');
        context.items[0].title = 'New Title';
        refresh();
        sprite.titleText.text.should.equal('New Title');
    });

    it('should redraw only for selection or color reference changes and update all text colors', () => {
        const clear = vi.spyOn(sprite.graphics, 'clear');
        const stroke = vi.spyOn(sprite.graphics, 'stroke');
        refresh();
        refresh();
        clear.mock.calls.should.have.lengthOf(1);
        stroke.mock.calls[0].should.deep.equal([{ width: 1, color: context.colors.border, alpha: 0.35 }]);
        refresh(0);
        clear.mock.calls.should.have.lengthOf(2);
        stroke.mock.calls[1].should.deep.equal([{ width: 2, color: context.colors.border }]);
        context.colors = { ...context.colors, text: '#112233', textSecondary: '#445566' };
        refresh(0);
        clear.mock.calls.should.have.lengthOf(3);
        sprite.titleText.style.fill.should.equal('#112233');
        sprite.labelsText.style.fill.should.equal('#445566');
        sprite.valuesText.style.fill.should.equal('#112233');
    });

    it('should recreate destroyed graphics at the back of the card before drawing', () => {
        sprite.graphics.destroy();
        refresh(0);
        sprite.graphics.destroyed.should.be.false;
        sprite.container.children[0].should.equal(sprite.graphics);
    });

    it('should leave the card unchanged if one of its text objects is destroyed', () => {
        sprite.titleText.destroy();
        const clear = vi.spyOn(sprite.graphics, 'clear');
        refresh();
        clear.mock.calls.should.have.lengthOf(0);
        (sprite.lastSelectedId === undefined).should.be.true;
    });
});
