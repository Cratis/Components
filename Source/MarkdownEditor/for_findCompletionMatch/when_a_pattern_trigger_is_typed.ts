// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { findCompletionMatch } from '../findCompletionMatch';
import { aCompletion } from './given';

describe('when a pattern trigger is typed', () => {
    const completion = aCompletion({ trigger: /(?<=^|\s)\[\[(?<query>[^\]]*)$/u });

    describe('and its match ends at the caret', () => {
        const markdown = 'link to [[Sample';
        const result = findCompletionMatch(markdown, markdown.length, [completion]);

        it('should take the named group as the query', () => result!.query.should.equal('Sample'));
        it('should start where the match starts', () => result!.start.should.equal(8));
    });

    describe('and its match does not reach the caret', () => {
        const markdown = 'link to [[Sample]] done';
        const result = findCompletionMatch(markdown, markdown.length, [completion]);

        it('should not match', () => (result === undefined).should.be.true);
    });

    describe('with a global flag', () => {
        const global = aCompletion({ trigger: /:(\w*)$/gu });
        const markdown = 'smile :sm';
        findCompletionMatch(markdown, markdown.length, [global]);
        const result = findCompletionMatch(markdown, markdown.length, [global]);

        it('should match every time rather than resuming where the last match ended', () =>
            result!.query.should.equal('sm'));
    });
});
