// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { findCompletionMatch } from '../findCompletionMatch';
import { aCompletion } from './given';

describe('when several triggers match', () => {
    const issues = aCompletion({ trigger: '#', allowSpaces: true });
    const people = aCompletion({ trigger: '@' });
    const markdown = '#12 asks @sam';
    const result = findCompletionMatch(markdown, markdown.length, [issues, people]);

    it('should pick the one closest to the caret', () => result!.completion.should.equal(people));
    it('should report where it sits in the configured list', () => result!.completionIndex.should.equal(1));
});
