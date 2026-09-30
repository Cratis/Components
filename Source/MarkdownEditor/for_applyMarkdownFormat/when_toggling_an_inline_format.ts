// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyMarkdownFormat } from '../applyMarkdownFormat';
import { MarkdownFormat } from '../MarkdownFormat';

describe('when toggling an inline format', () => {
    describe('on a selection without it', () => {
        const result = applyMarkdownFormat('make this loud', 5, 9, MarkdownFormat.Bold);

        it('should wrap the selection in the marker', () => result.value.should.equal('make **this** loud'));
        it('should keep the same text selected', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('this'));
    });

    describe('on a selection wrapped just outside it', () => {
        const result = applyMarkdownFormat('make **this** loud', 7, 11, MarkdownFormat.Bold);

        it('should take the marker off', () => result.value.should.equal('make this loud'));
        it('should keep the same text selected', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('this'));
    });

    describe('on a selection that includes the markers', () => {
        const result = applyMarkdownFormat('make ~~this~~ quiet', 5, 13, MarkdownFormat.Strikethrough);

        it('should take the markers off', () => result.value.should.equal('make this quiet'));
        it('should select the text that was inside them', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('this'));
    });

    describe('at a plain caret', () => {
        const result = applyMarkdownFormat('say ', 4, 4, MarkdownFormat.Code);

        it('should put an empty pair of markers in', () => result.value.should.equal('say ``'));
        it('should leave the caret between them', () => {
            result.selectionStart.should.equal(5);
            result.selectionEnd.should.equal(5);
        });
    });

    describe('on a selection made backwards', () => {
        const result = applyMarkdownFormat('lean', 4, 0, MarkdownFormat.Italic);

        it('should format the selected text all the same', () => result.value.should.equal('_lean_'));
    });
});
