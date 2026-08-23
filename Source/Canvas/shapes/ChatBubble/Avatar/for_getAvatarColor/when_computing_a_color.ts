// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getAvatarColor } from '../getAvatarColor';

describe('when computing a color for the same initials twice', () => {
    it('should return the same color both times', () => {
        getAvatarColor('JD').should.equal(getAvatarColor('JD'));
    });
});

describe('when computing colors for different initials', () => {
    it('should be able to return different colors', () => {
        getAvatarColor('JD').should.not.equal(getAvatarColor('ZZ'));
    });
});

describe('when computing a color', () => {
    it('should return a value from the predefined palette', () => {
        const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9', '#10b981', '#14b8a6'];
        palette.should.contain(getAvatarColor('AB'));
    });
});
