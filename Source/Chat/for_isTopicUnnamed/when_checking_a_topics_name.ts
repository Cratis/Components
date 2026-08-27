// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isTopicUnnamed } from '../isTopicUnnamed';

describe('when the topic has a name', () => {
    it('should not count as unnamed', () =>
        isTopicUnnamed({ id: 'topic', name: 'Sprint planning' }).should.be.false);
});

describe('when the topic has no name at all', () => {
    it('should count as unnamed', () => isTopicUnnamed({ id: 'topic' }).should.be.true);
});

describe('when the name is only whitespace', () => {
    it('should count as unnamed', () =>
        isTopicUnnamed({ id: 'topic', name: '   ' }).should.be.true);
});
