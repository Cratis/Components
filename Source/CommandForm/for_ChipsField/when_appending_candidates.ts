// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { appendChipCandidates } from '../fields/chipValues';

describe('when appending chip candidates', () => {
    it('should_remove_duplicates_within_one_committed_draft_by_default', () => {
        const result = appendChipCandidates(['alpha'], ['beta', 'beta'], undefined, false);

        expect(result).to.deep.equal(['alpha', 'beta']);
    });

    it('should_deduplicate_before_applying_the_maximum', () => {
        const result = appendChipCandidates(['alpha'], ['alpha', 'beta'], 2, false);

        expect(result).to.deep.equal(['alpha', 'beta']);
    });

    it('should_preserve_duplicates_when_explicitly_allowed', () => {
        const result = appendChipCandidates(['alpha'], ['beta', 'beta', 'gamma'], 3, true);

        expect(result).to.deep.equal(['alpha', 'beta', 'beta']);
    });
});
