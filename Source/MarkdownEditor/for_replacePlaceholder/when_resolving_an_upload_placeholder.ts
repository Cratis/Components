// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { replacePlaceholder } from '../replacePlaceholder';
import { uploadPlaceholderFor } from '../uploadPlaceholderFor';

describe('when resolving an upload placeholder', () => {
    const placeholder = uploadPlaceholderFor('sample.png');

    describe('that is still there', () => {
        const result = replacePlaceholder(`before ${placeholder} after`, placeholder, '![sample](https://example.invalid/sample.png)');

        it('should put the markup in its place', () =>
            result.should.equal('before ![sample](https://example.invalid/sample.png) after'));
    });

    describe('that was deleted while uploading', () => {
        const result = replacePlaceholder('nothing here', placeholder, 'markup');

        it('should leave the markdown untouched', () => result.should.equal('nothing here'));
    });

    describe('with markup holding replacement patterns', () => {
        const result = replacePlaceholder(placeholder, placeholder, 'cost $& more');

        it('should put the markup in literally', () => result.should.equal('cost $& more'));
    });
});
