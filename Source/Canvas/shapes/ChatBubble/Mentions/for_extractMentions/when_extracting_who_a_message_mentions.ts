// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { extractMentions } from '../extractMentions';

const alice = { name: 'Alice' };
const scout = { name: 'Scout' };

describe('when the message mentions two candidates', () => {
    const mentions = extractMentions('@Scout could you and @Alice pair on this?', [alice, scout]);

    it('should extract both', () => mentions.should.have.lengthOf(2));
    it('should keep the order of first appearance', () => {
        mentions[0].should.equal(scout);
        mentions[1].should.equal(alice);
    });
});

describe('when the same candidate is mentioned twice', () => {
    const mentions = extractMentions('@Alice — @Alice, are you there?', [alice]);

    it('should extract them once', () => mentions.should.have.lengthOf(1));
});

describe('when a picked mention was edited away again', () => {
    const mentions = extractMentions('never mind, solved it myself', [alice, scout]);

    it('should extract nothing', () => mentions.should.have.lengthOf(0));
});
