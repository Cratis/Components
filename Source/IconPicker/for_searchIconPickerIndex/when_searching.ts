// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createIconPickerIndex } from '../createIconPickerIndex';
import { searchIconPickerIndex } from '../searchIconPickerIndex';
import { twoLibraryCatalog } from '../for_IconPicker/given/a_synthetic_catalog';

describe('when searching the index', () => {
    const index = createIconPickerIndex(twoLibraryCatalog().icons);
    const names = (query: string) => searchIconPickerIndex(index, query).map(candidate => candidate.entry.name);

    it('should match everything for a blank query', () => names('   ').length.should.equal(index.length));
    it('should ignore case', () => names('hOmE').should.deep.equal(['Home', 'Home']));
    it('should match a tag', () => names('cog').should.deep.equal(['Gear']));
    it('should match an alias', () => names('back').should.deep.equal(['Arrow left']));
    it('should require every word', () => names('arrow right').should.deep.equal(['Arrow right']));
    it('should ignore word order', () => names('right arrow').should.deep.equal(['Arrow right']));
    it('should not match the key', () => names('arrow-left').should.be.empty);
});
