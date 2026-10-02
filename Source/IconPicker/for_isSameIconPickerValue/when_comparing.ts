// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isSameIconPickerValue } from '../isSameIconPickerValue';

describe('when comparing icon values', () => {
    const home = { library: 'example-glyphs', key: 'home' };

    it('should match identical values', () => isSameIconPickerValue(home, { ...home }).should.be.true);
    it('should not match the same key in another library', () =>
        isSameIconPickerValue(home, { library: 'sample-symbols', key: 'home' }).should.be.false);
    it('should not match another key in the same library', () =>
        isSameIconPickerValue(home, { library: 'example-glyphs', key: 'map' }).should.be.false);
    it('should not match another variant', () =>
        isSameIconPickerValue({ ...home, variant: 'solid' }, { ...home, variant: 'outline' }).should.be.false);
    it('should not match a variant against none', () => isSameIconPickerValue(home, { ...home, variant: 'solid' }).should.be.false);
});
