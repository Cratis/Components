// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatTopic } from '../ChatTopic';
import { topicsByActivity } from '../topicsByActivity';

const quiet: ChatTopic = { id: 'quiet', name: 'Quiet', lastActivity: new Date('2026-08-20T10:00:00Z') };
const busy: ChatTopic = { id: 'busy', name: 'Busy', lastActivity: new Date('2026-08-26T10:00:00Z') };
const justStarted: ChatTopic = { id: 'started', name: 'Just started', started: new Date('2026-08-25T10:00:00Z') };

describe('when topics arrive in no particular order', () => {
    const ordered = topicsByActivity([quiet, busy, justStarted]);

    it('should put the most recently active first', () => ordered[0].should.equal(busy));
    it('should fall back to when a topic started', () => ordered[1].should.equal(justStarted));
    it('should put the quiet one last', () => ordered[2].should.equal(quiet));
    it('should leave the given array untouched', () => {
        topicsByActivity([quiet, busy]);
        [quiet, busy][0].should.equal(quiet);
    });
});

describe('when a date traveled through JSON as a string', () => {
    const stringly = { id: 'stringly', name: 'Stringly', lastActivity: '2026-08-27T10:00:00Z' as unknown as Date };
    const ordered = topicsByActivity([busy, stringly]);

    it('should still order by it', () => ordered[0].should.equal(stringly));
});

describe('when a topic has no dates at all', () => {
    const dateless: ChatTopic = { id: 'dateless', name: 'Dateless' };
    const ordered = topicsByActivity([dateless, busy]);

    it('should sink to the bottom', () => ordered[1].should.equal(dateless));
});
