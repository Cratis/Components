// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyMarkdownFormat } from '../applyMarkdownFormat';
import { MarkdownFormat } from '../MarkdownFormat';

describe('when toggling a line format', () => {
    describe('on a selection across lines without it', () => {
        const markdown = 'intro\nfirst\nsecond\noutro';
        const result = applyMarkdownFormat(markdown, 8, 15, MarkdownFormat.BulletList);

        it('should prefix every touched line', () => result.value.should.equal('intro\n- first\n- second\noutro'));
        it('should select the edited lines', () =>
            result.value.slice(result.selectionStart, result.selectionEnd).should.equal('- first\n- second'));
    });

    describe('on lines that all have it', () => {
        const result = applyMarkdownFormat('> one\n> two', 0, 11, MarkdownFormat.Quote);

        it('should take the prefix off every line', () => result.value.should.equal('one\ntwo'));
    });

    describe('as a numbered list', () => {
        const result = applyMarkdownFormat('one\ntwo\nthree', 0, 13, MarkdownFormat.NumberedList);

        it('should number the lines in order', () => result.value.should.equal('1. one\n2. two\n3. three'));
    });

    describe('as a heading at a caret', () => {
        const result = applyMarkdownFormat('Title', 2, 2, MarkdownFormat.Heading);

        it('should prefix the caret line', () => result.value.should.equal('## Title'));
        it('should keep the caret on the same letter', () => result.selectionStart.should.equal(5));
    });

    describe('as a bullet list on a task list line', () => {
        const result = applyMarkdownFormat('- [ ] chore', 0, 0, MarkdownFormat.BulletList);

        it('should not mistake the task for a bullet', () => result.value.should.equal('- - [ ] chore'));
    });

    describe('with a selection ending at the start of the next line', () => {
        const result = applyMarkdownFormat('one\ntwo', 0, 4, MarkdownFormat.TaskList);

        it('should leave that next line alone', () => result.value.should.equal('- [ ] one\ntwo'));
    });
});
