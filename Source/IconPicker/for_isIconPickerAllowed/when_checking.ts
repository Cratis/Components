// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isIconPickerAllowed } from '../isIconPickerAllowed';

describe('when checking whether an icon is allowed', () => {
    const entry = { library: 'example-glyphs', key: 'home', name: 'Home', categories: ['Places'], renderPreview: () => null };

    it('should allow everything without a restriction', () => isIconPickerAllowed(entry, undefined).should.be.true);
    it('should allow a listed value', () => isIconPickerAllowed(entry, [{ library: 'example-glyphs', key: 'home' }]).should.be.true);
    it('should not allow an unlisted value', () => isIconPickerAllowed(entry, [{ library: 'example-glyphs', key: 'map' }]).should.be.false);
    it('should not allow the same key from another library', () =>
        isIconPickerAllowed(entry, [{ library: 'sample-symbols', key: 'home' }]).should.be.false);
    it('should ask a predicate', () => isIconPickerAllowed(entry, candidate => candidate.name === 'Home').should.be.true);
    it('should honor a predicate that refuses', () => isIconPickerAllowed(entry, () => false).should.be.false);
});
