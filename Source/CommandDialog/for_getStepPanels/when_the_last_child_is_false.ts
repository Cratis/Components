// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when the last child is false', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels([
            React.createElement('div', { key: 'first', 'data-name': 'first' }),
            React.createElement('div', { key: 'second', 'data-name': 'second' }),
            false
        ]);
    });

    it('should_drop_the_false_child', () => {
        result.should.have.lengthOf(2);
    });

    it('should_keep_the_remaining_children_in_order', () => {
        (result[0].props as { 'data-name': string })['data-name'].should.equal('first');
        (result[1].props as { 'data-name': string })['data-name'].should.equal('second');
    });
});
