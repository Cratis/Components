// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { vi } from 'vitest';
import { clearSpritePool, destroySprite } from '../components/pivot/sprites';
import type { CardSprite } from '../components/pivot/constants';
import { a_card } from './given/a_card';

describe('when creating a card sprite', () => {
    let context: a_card;
    let sprite: CardSprite;

    beforeEach(() => {
        context = new a_card();
        sprite = context.create('0');
    });

    afterEach(() => {
        destroySprite(sprite);
        clearSpritePool();
        vi.restoreAllMocks();
    });

    it('should position the card and hit area inside the card gap', () => {
        [sprite.currentX, sprite.currentY, sprite.targetX, sprite.targetY].should.deep.equal([20, 30, 20, 30]);
        [sprite.container.x, sprite.container.y].should.deep.equal([20, 30]);
        sprite.container.hitArea!.should.include({ x: 4, y: 4, width: 120, height: 92 });
        sprite.container.children.should.deep.equal([sprite.graphics, sprite.titleText, sprite.labelsText, sprite.valuesText]);
        [sprite.titleText.x, sprite.titleText.y, sprite.valuesText.x, sprite.valuesText.y].should.deep.equal([14, 14, 79, 54]);
    });

    it('should resolve numeric string identifiers and forward the native click event', () => {
        const event = { stopPropagation: vi.fn(), nativeEvent: { type: 'click' } };
        sprite.container.emit('click', event);
        event.stopPropagation.mock.calls.should.have.lengthOf(1);
        context.onCardClick.mock.calls.should.deep.equal([[context.items[0], event.nativeEvent, '0']]);
    });

    it('should stop pointer propagation without starting a pan', () => {
        const event = { stopPropagation: vi.fn() };
        sprite.container.emit('pointerdown', event);
        event.stopPropagation.mock.calls.should.have.lengthOf(1);
        context.onPanStart.mock.calls.should.have.lengthOf(0);
    });
});
