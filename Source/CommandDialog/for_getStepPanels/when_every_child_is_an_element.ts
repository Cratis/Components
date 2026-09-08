// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when every child is an element', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels([
            React.createElement('div', { key: 'first' }),
            React.createElement('div', { key: 'second' }),
            React.createElement('div', { key: 'third' })
        ]);
    });

    it('should_keep_every_child', () => {
        result.should.have.lengthOf(3);
    });
});
