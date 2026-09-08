// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when a child is undefined', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels([
            React.createElement('div', { key: 'first' }),
            React.createElement('div', { key: 'second' }),
            undefined
        ]);
    });

    it('should_drop_the_undefined_child', () => {
        result.should.have.lengthOf(2);
    });
});
