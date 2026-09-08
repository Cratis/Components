// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when a bare string sits between two elements', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels([
            React.createElement('div', { key: 'first', 'data-name': 'first' }),
            '   ',
            React.createElement('div', { key: 'third', 'data-name': 'third' })
        ]);
    });

    it('should_not_treat_the_string_as_a_step', () => {
        result.should.have.lengthOf(2);
    });

    it('should_keep_the_element_children', () => {
        (result[0].props as { 'data-name': string })['data-name'].should.equal('first');
        (result[1].props as { 'data-name': string })['data-name'].should.equal('third');
    });
});
