// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createIconPickerIndex } from '../createIconPickerIndex';
import { entry } from '../for_IconPicker/given/a_synthetic_catalog';

describe('when creating the index', () => {
    const index = createIconPickerIndex([
        entry('example-glyphs', 'home', 'Home', []),
        entry('example-glyphs', 'home', 'Home again', []),
        entry('sample-symbols', 'home', 'Home', []),
    ]);

    it('should keep one entry per qualified identity', () => index.length.should.equal(2));
    it('should keep the first of a repeated identity', () => index[0].entry.name.should.equal('Home'));
    it('should keep the same key from another library', () => index[1].entry.library.should.equal('sample-symbols'));
    it('should give each entry a distinct identity', () => new Set(index.map(candidate => candidate.identity)).size.should.equal(2));
});
