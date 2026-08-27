// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { shouldRequestTopicName } from '../shouldRequestTopicName';

describe('when the first message lands in an unnamed topic', () => {
    it('should ask for a name', () => shouldRequestTopicName(true, 0).should.be.true);
});

describe('when a later message lands in a topic that is still unnamed', () => {
    it('should not ask again', () => shouldRequestTopicName(true, 3).should.be.false);
});

describe('when the first message lands in a topic that already has a name', () => {
    it('should leave the name alone', () => shouldRequestTopicName(false, 0).should.be.false);
});

describe('when a later message lands in a named topic', () => {
    it('should not ask', () => shouldRequestTopicName(false, 5).should.be.false);
});
