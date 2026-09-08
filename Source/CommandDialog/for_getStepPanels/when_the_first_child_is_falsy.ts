// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { getStepPanels } from '../stepChildren';

describe('when the first child is falsy', () => {
    let result: React.ReactElement[];

    beforeEach(() => {
        result = getStepPanels([
            false,
            React.createElement('div', { key: 'second', 'data-name': 'second' }),
            React.createElement('div', { key: 'third', 'data-name': 'third' })
        ]);
    });

    it('should_drop_the_falsy_child', () => {
        result.should.have.lengthOf(2);
    });

    it('should_make_the_first_rendered_child_the_first_step', () => {
        (result[0].props as { 'data-name': string })['data-name'].should.equal('second');
    });
});
