// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import { clearSpritePool, destroySprite, getSpritePoolSize } from '../components/pivot/sprites';
import type { CardSprite } from '../components/pivot/constants';
import { a_card } from './given/a_card';

describe('when recycling a pooled card sprite', () => {
    let context: a_card;
    let original: CardSprite;
    let recycled: CardSprite;
    let previousTitle: CardSprite['titleText'];
    let previousValues: CardSprite['valuesText'];
    let previousClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        context = new a_card();
        previousClick = context.onCardClick;
        original = context.create();
        Object.assign(original, {
            animationStartTime: 10, animationDelay: 20, startX: 1, startY: 2, __lastHiddenAt: 30,
            lastTitle: 'Old Title', lastLabels: 'Old Label', lastValues: 'Old Value', lastSelectedId: 0,
            lastCardColors: context.colors,
        });
        original.container.alpha = 0.2;
        previousTitle = original.titleText;
        previousValues = original.valuesText;
        original.valuesText.destroy();
        destroySprite(original);
        context.items = [{ title: 'Replacement Card', labels: [], values: [] }];
        context.onCardClick = vi.fn();
        recycled = context.create('0', 40, 50);
    });

    afterEach(() => {
        destroySprite(recycled);
        clearSpritePool();
        vi.restoreAllMocks();
    });

    it('should reuse the container restore visibility and reset motion and content caches', () => {
        recycled.should.equal(original);
        recycled.container.visible.should.be.true;
        recycled.container.alpha.should.equal(1);
        [recycled.currentX, recycled.currentY, recycled.targetX, recycled.targetY].should.deep.equal([40, 50, 40, 50]);
        ['animationStartTime', 'animationDelay', 'startX', 'startY', '__lastHiddenAt'].forEach(key => recycled.should.not.have.property(key));
        [recycled.lastTitle, recycled.lastLabels, recycled.lastValues, recycled.lastCardColors].should.deep.equal([undefined, undefined, undefined, undefined]);
        (recycled.lastSelectedId === null).should.be.true;
        getSpritePoolSize().should.equal(0);
    });

    it('should recreate destroyed text and retain live text', () => {
        recycled.valuesText.destroyed.should.be.false;
        recycled.valuesText.should.not.equal(previousValues);
        recycled.titleText.should.equal(previousTitle);
        [recycled.valuesText.x, recycled.valuesText.y].should.deep.equal([79, 54]);
    });

    it('should use only the replacement event context without accumulating click handlers', () => {
        const event = { stopPropagation: vi.fn(), nativeEvent: { type: 'click' } };
        recycled.container.emit('click', event);
        context.onCardClick.mock.calls.should.deep.equal([[context.items[0], event.nativeEvent, '0']]);
        previousClick.mock.calls.should.have.lengthOf(0);
        recycled.container.listenerCount('click').should.equal(1);
    });
});
