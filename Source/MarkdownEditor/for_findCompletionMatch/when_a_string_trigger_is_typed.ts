// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { findCompletionMatch } from '../findCompletionMatch';
import { aCompletion } from './given';

describe('when a string trigger is typed', () => {
    describe('after whitespace', () => {
        const markdown = 'Related to #12';
        const result = findCompletionMatch(markdown, markdown.length, [aCompletion()]);

        it('should find the query after it', () => result!.query.should.equal('12'));
        it('should start at the trigger', () => result!.start.should.equal(11));
        it('should end at the caret', () => result!.end.should.equal(markdown.length));
    });

    describe('at the start of a line', () => {
        const markdown = 'first line\n#';
        const result = findCompletionMatch(markdown, markdown.length, [aCompletion()]);

        it('should match with an empty query', () => result!.query.should.equal(''));
    });

    describe('inside a word', () => {
        const markdown = 'C#';
        const result = findCompletionMatch(markdown, markdown.length, [aCompletion()]);

        it('should not match', () => (result === undefined).should.be.true);
    });

    describe('followed by a space when spaces are not allowed', () => {
        const markdown = '@sample user';
        const result = findCompletionMatch(markdown, markdown.length, [aCompletion({ trigger: '@' })]);

        it('should not match', () => (result === undefined).should.be.true);
    });

    describe('followed by a title when spaces are allowed', () => {
        const markdown = 'see # model discovery';
        const result = findCompletionMatch(markdown, markdown.length, [aCompletion({ allowSpaces: true })]);

        it('should take the title as the query without its leading space', () =>
            result!.query.should.equal('model discovery'));
    });

    describe('with fewer characters than the minimum', () => {
        const markdown = 'ask :s';
        const result = findCompletionMatch(markdown, markdown.length, [
            aCompletion({ trigger: ':', minimumQueryLength: 2 }),
        ]);

        it('should not match', () => (result === undefined).should.be.true);
    });

    describe('on an earlier line only', () => {
        const markdown = '#12\nnext';
        const result = findCompletionMatch(markdown, markdown.length, [aCompletion({ allowSpaces: true })]);

        it('should not match', () => (result === undefined).should.be.true);
    });
});
