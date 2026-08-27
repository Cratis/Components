// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { mentionSegments } from '../mentionSegments';

const alice = { name: 'Alice' };

describe('when the body mentions somebody in the middle', () => {
    const segments = mentionSegments('could @Alice take a look?', [alice]);

    it('should split into three runs', () => segments.should.have.lengthOf(3));
    it('should keep the text before', () => segments[0].text.should.equal('could '));
    it('should carry the mention with its @', () => segments[1].text.should.equal('@Alice'));
    it('should know who the mention addresses', () => segments[1].mention!.should.equal(alice));
    it('should keep the text after', () => segments[2].text.should.equal(' take a look?'));
    it('should leave the plain runs unmarked', () => {
        (segments[0].mention === undefined).should.be.true;
        (segments[2].mention === undefined).should.be.true;
    });
});

describe('when the body starts with a mention', () => {
    const segments = mentionSegments('@Alice ping', [alice]);

    it('should start with the mention run', () => {
        segments[0].text.should.equal('@Alice');
        segments[0].mention!.should.equal(alice);
    });
});

describe('when the body mentions nobody', () => {
    const segments = mentionSegments('all quiet here', [alice]);

    it('should come back as one plain run', () => segments.should.have.lengthOf(1));
    it('should carry the whole body', () => segments[0].text.should.equal('all quiet here'));
});

describe('when the body is empty', () => {
    const segments = mentionSegments('', [alice]);

    it('should come back as one empty run', () => {
        segments.should.have.lengthOf(1);
        segments[0].text.should.equal('');
    });
});
