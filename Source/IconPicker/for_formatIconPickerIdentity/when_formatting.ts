// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { formatIconPickerIdentity } from '../formatIconPickerIdentity';

describe('when formatting an identity', () => {
    it('should join the library and key', () =>
        formatIconPickerIdentity({ library: 'example-glyphs', key: 'home' }).should.equal('example-glyphs / home'));
    it('should include the variant', () =>
        formatIconPickerIdentity({ library: 'example-glyphs', key: 'home', variant: 'solid' }).should.equal('example-glyphs / home / solid'));
});
