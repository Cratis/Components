// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when children are produced by a map', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels(
            ['first', 'second', 'third', 'fourth'].map(name =>
                React.createElement('div', { key: name, 'data-name': name }))
        );
    });

    it('should_flatten_the_array_into_one_step_per_element', () => {
        result.should.have.lengthOf(4);
    });
});
