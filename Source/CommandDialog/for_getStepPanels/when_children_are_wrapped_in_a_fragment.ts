// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

// Fragments are not flattened — this pins the long-standing behavior so that adding
// fragment support later is a deliberate, visible change rather than an accident.
describe('when children are wrapped in a fragment', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels(
            React.createElement(
                React.Fragment,
                null,
                React.createElement('div', { key: 'first' }),
                React.createElement('div', { key: 'second' })
            )
        );
    });

    it('should_treat_the_fragment_as_a_single_step', () => {
        result.should.have.lengthOf(1);
    });
});
