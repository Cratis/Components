// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { syncSpritesToViewport } from '../../components/pivot/visibility';
import { a_transition } from '../given/a_transition';

describe('when transitioning with offscreen target positions and initial layout entries are offscreen', () => {
    let context: a_transition;

    beforeEach(() => {
        context = new a_transition();
        context.layout.positions.set(6, { x: 10, y: 16000, groupIndex: 0 });
        context.previousLayout.positions.set(6, { x: 10, y: 100, groupIndex: 0 });
        syncSpritesToViewport(context.params);
    });

    it('should not create the first offscreen cards', () => {
        context.createdIds.should.deep.equal([6]);
    });
});
