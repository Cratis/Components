// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DEFAULT_EMOJIS, recentEmojis } from '../../recentEmojis';
import { a_memory } from '../given/a_memory';

describe('when offering the quick row and the history cannot be read', () => {
    let fromRubbish: string[];
    let fromTheWrongShape: string[];

    beforeEach(() => {
        const rubbish = new a_memory();
        rubbish.stored['cratis.components.canvas.chat.recent-emojis'] = 'not json at all';
        fromRubbish = recentEmojis(rubbish);

        const wrongShape = new a_memory();
        wrongShape.stored['cratis.components.canvas.chat.recent-emojis'] = '{"an":"object"}';
        fromTheWrongShape = recentEmojis(wrongShape);
    });

    // Storage is shared with everything else the browser keeps for the app, and survives releases -
    // so it can hold anything. A row that fell over would take the reaction button with it.
    it('should fall back to the commonly used ones', () => fromRubbish.should.deep.equal([...DEFAULT_EMOJIS]));
    it('should fall back when the stored value is not a list', () => fromTheWrongShape.should.deep.equal([...DEFAULT_EMOJIS]));
});
