// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ChatAuthorKind } from '../../ChatAuthorKind';
import type { MentionCandidate } from '../MentionCandidate';
import { matchCandidates } from '../matchCandidates';

const candidate = (name: string, kind = ChatAuthorKind.User): MentionCandidate =>
    ({ id: name, name, hasAvatar: false, kind });

const candidates = [
    candidate('Modeler', ChatAuthorKind.Agent),
    candidate('Sample User 01'),
    candidate('Sample User 02'),
    candidate('Model Reviewer', ChatAuthorKind.Agent),
];

describe('when nothing has been typed yet', () => {
    it('should offer everyone', () => matchCandidates(candidates, '').should.have.lengthOf(4));
});

describe('when what was typed matches the start of a name', () => {
    let matches: MentionCandidate[];

    beforeEach(() => { matches = matchCandidates(candidates, 'Mod'); });

    it('should offer only the matching names', () => matches.should.have.lengthOf(2));
    it('should offer the agent first', () => matches[0].name.should.equal('Modeler'));
});

describe('when what was typed appears in the middle of a name', () => {
    let matches: MentionCandidate[];

    beforeEach(() => { matches = matchCandidates(candidates, 'User 01'); });

    it('should still offer that name', () => matches.should.have.lengthOf(1));
    it('should offer the right one', () => matches[0].name.should.equal('Sample User 01'));
});

describe('when what was typed is in a different case', () => {
    it('should still match', () => matchCandidates(candidates, 'sample user 02').should.have.lengthOf(1));
});

describe('when a name that starts with the query is not first in the list', () => {
    let matches: MentionCandidate[];

    beforeEach(() => {
        matches = matchCandidates(
            [candidate('Example Sample'), candidate('Sample User 02')],
            'Sample',
        );
    });

    it('should offer the one that starts with it first', () => matches[0].name.should.equal('Sample User 02'));
});

describe('when nothing matches', () => {
    it('should offer nobody', () => matchCandidates(candidates, 'zzz').should.be.empty);
});

describe('when there are more matches than the list can show', () => {
    it('should cap how many are offered', () =>
        matchCandidates(
            Array.from({ length: 20 }, (_, index) => candidate(`Sample User ${index}`)),
            'Sample User',
        ).should.have.lengthOf(6));
});
