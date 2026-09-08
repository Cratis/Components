// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import type { CardColors, CardSprite } from '../components/pivot/constants';
import { updateCardTextColors } from '../components/pivot/sprites';

describe('when existing Pixi card colors change', () => {
    it('should_refresh_title_label_and_value_fills', () => {
        const text = (fill: string) => ({ style: { fill } });
        // SAFETY: This focused fake implements exactly the text-style fields read by the helper.
        const sprite = {
            titleText: text('old-title'),
            labelsText: text('old-label'),
            valuesText: text('old-value'),
        } as unknown as CardSprite;
        const colors: CardColors = {
            base: '#000000',
            mid: '#000000',
            gradient: '#000000',
            border: '#000000',
            text: '#112233',
            textSecondary: '#445566',
        };

        updateCardTextColors(sprite, colors);

        expect(sprite.titleText?.style.fill).to.equal('#112233');
        expect(sprite.labelsText?.style.fill).to.equal('#445566');
        expect(sprite.valuesText?.style.fill).to.equal('#112233');
    });
});
