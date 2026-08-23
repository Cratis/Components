// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getInitials } from '../getInitials';

describe('when computing initials from a two-word name', () => {
    it('should use the first letter of each word', () => {
        getInitials('Jane Doe').should.equal('JD');
    });
});

describe('when computing initials from a single-word name', () => {
    it('should use just the first letter of that word', () => {
        getInitials('Cher').should.equal('C');
    });
});

describe('when computing initials from a name with extra whitespace', () => {
    it('should ignore the extra whitespace', () => {
        getInitials('  Jane   Doe  ').should.equal('JD');
    });
});

describe('when computing initials from an empty name', () => {
    it('should fall back to a single question mark', () => {
        getInitials('').should.equal('?');
    });
});

describe('when computing initials from a three-word name', () => {
    it('should use only the first two words', () => {
        getInitials('Jane Middle Doe').should.equal('JM');
    });
});
