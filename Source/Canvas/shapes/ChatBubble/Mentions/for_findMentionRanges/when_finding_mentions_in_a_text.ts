// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { findMentionRanges } from '../findMentionRanges';

const alice = { name: 'Alice' };
const aliceJohnson = { name: 'Alice Johnson' };
const scout = { name: 'Scout' };

describe('when the text mentions one candidate', () => {
    const ranges = findMentionRanges('could @Alice take a look', [alice, scout]);

    it('should find one mention', () => ranges.should.have.lengthOf(1));
    it('should know who is mentioned', () => ranges[0].candidate.should.equal(alice));
    it('should start at the @', () => ranges[0].start.should.equal(6));
    it('should end just past the name', () => ranges[0].end.should.equal(12));
});

describe('when the casing differs from the candidate', () => {
    const ranges = findMentionRanges('ping @alice about it', [alice]);

    it('should still find the mention', () => ranges.should.have.lengthOf(1));
});

describe('when two names overlap', () => {
    const ranges = findMentionRanges('ask @Alice Johnson first', [alice, aliceJohnson]);

    it('should find one mention', () => ranges.should.have.lengthOf(1));
    it('should prefer the longer name', () => ranges[0].candidate.should.equal(aliceJohnson));
});

describe('when the name continues into a longer word', () => {
    const ranges = findMentionRanges('the @Scouting party', [scout]);

    it('should not treat it as a mention', () => ranges.should.have.lengthOf(0));
});

describe('when the @ sits inside a word', () => {
    const ranges = findMentionRanges('mail scout@Alice.example', [alice]);

    it('should not treat an address as a mention', () => ranges.should.have.lengthOf(0));
});

describe('when the same candidate is mentioned twice', () => {
    const ranges = findMentionRanges('@Scout and again @Scout', [scout]);

    it('should find both occurrences', () => ranges.should.have.lengthOf(2));
    it('should order them by where they appear', () => {
        ranges[0].start.should.equal(0);
        ranges[1].start.should.equal(17);
    });
});
