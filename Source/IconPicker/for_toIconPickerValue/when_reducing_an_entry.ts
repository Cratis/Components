// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toIconPickerValue } from '../toIconPickerValue';

describe('when reducing an entry to its value', () => {
    const entry = {
        library: 'example-glyphs',
        key: 'home',
        name: 'Home',
        categories: ['Places'],
        renderPreview: () => null,
    };

    it('should keep only the library and key without a variant', () =>
        toIconPickerValue(entry).should.deep.equal({ library: 'example-glyphs', key: 'home' }));
    it('should keep the variant when there is one', () =>
        toIconPickerValue({ ...entry, variant: 'solid' }).should.deep.equal({ library: 'example-glyphs', key: 'home', variant: 'solid' }));
    it('should return a new object', () => (toIconPickerValue(entry) === (entry as unknown)).should.be.false);
});
