// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyMarkdownFormat } from '../applyMarkdownFormat';
import { MarkdownFormat } from '../MarkdownFormat';

describe('when inserting a link', () => {
    describe('around selected text', () => {
        const result = applyMarkdownFormat('see the docs', 8, 12, MarkdownFormat.Link);

        it('should link the text', () => result.value.should.equal('see the [docs](url)'));
        it('should select the address to type over', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('url'));
    });

    describe('around a selected address', () => {
        const result = applyMarkdownFormat('https://example.invalid', 0, 23, MarkdownFormat.Link);

        it('should use it as the address', () => result.value.should.equal('[text](https://example.invalid)'));
        it('should select the link text to type over', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('text'));
    });

    describe('at a plain caret', () => {
        const result = applyMarkdownFormat('', 0, 0, MarkdownFormat.Link);

        it('should put in an empty link', () => result.value.should.equal('[text](url)'));
        it('should select the link text', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('text'));
    });
});
