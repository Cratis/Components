// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createIconPickerIndex } from '../createIconPickerIndex';
import { groupIconPickerByCategory } from '../groupIconPickerByCategory';
import { entry } from '../for_IconPicker/given/a_synthetic_catalog';

describe('when grouping by category', () => {
    const groups = groupIconPickerByCategory(
        createIconPickerIndex([
            entry('l', 'a', 'A', []),
            entry('l', 'b', 'B', ['Second', 'First']),
            entry('l', 'c', 'C', ['First']),
        ]),
    );

    it('should order categories by first appearance, uncategorized last', () =>
        groups.map(group => group.category).should.deep.equal(['Second', 'First', '']));
    it('should list an icon under each of its categories', () =>
        groups.find(group => group.category === 'First')!.entries.map(candidate => candidate.name).should.deep.equal(['B', 'C']));
    it('should collect icons without a category', () =>
        groups.find(group => group.category === '')!.entries.map(candidate => candidate.name).should.deep.equal(['A']));
});
