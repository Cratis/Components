// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when a child in the middle is falsy', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels([
            React.createElement('div', { key: 'first', 'data-name': 'first' }),
            false,
            React.createElement('div', { key: 'third', 'data-name': 'third' })
        ]);
    });

    it('should_drop_the_falsy_child', () => {
        result.should.have.lengthOf(2);
    });

    it('should_close_the_gap_left_by_the_hidden_child', () => {
        (result[0].props as { 'data-name': string })['data-name'].should.equal('first');
        (result[1].props as { 'data-name': string })['data-name'].should.equal('third');
    });
});
