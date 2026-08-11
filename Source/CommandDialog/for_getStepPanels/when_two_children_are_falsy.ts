// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when two of four children are falsy', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels([
            React.createElement('div', { key: 'first' }),
            false,
            React.createElement('div', { key: 'third' }),
            undefined
        ]);
    });

    it('should_drop_every_falsy_child_not_just_one', () => {
        result.should.have.lengthOf(2);
    });
});
