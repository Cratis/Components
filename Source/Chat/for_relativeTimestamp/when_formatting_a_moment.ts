// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { relativeTimestamp } from '../relativeTimestamp';

const now = new Date('2026-08-27T12:00:00Z');

describe('when the moment is under a minute ago', () => {
    it('should say just now', () => relativeTimestamp(new Date('2026-08-27T11:59:30Z'), now).should.equal('just now'));
});

describe('when the moment is minutes ago', () => {
    it('should count the minutes', () => relativeTimestamp(new Date('2026-08-27T11:41:00Z'), now).should.equal('19m ago'));
});

describe('when the moment is hours ago', () => {
    it('should count the hours', () => relativeTimestamp(new Date('2026-08-27T07:00:00Z'), now).should.equal('5h ago'));
});

describe('when the moment is days ago', () => {
    it('should show a date instead', () => relativeTimestamp(new Date('2026-08-20T12:00:00Z'), now).should.contain('20'));
});

describe('when the host localizes the strings', () => {
    it('should use the overrides', () =>
        relativeTimestamp(new Date('2026-08-27T11:41:00Z'), now, { minutesAgo: 'for {minutes} min siden' })
            .should.equal('for 19 min siden'));
});
