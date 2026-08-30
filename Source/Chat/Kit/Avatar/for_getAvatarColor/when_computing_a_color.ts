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
        const palette = [
            '#4f46e5',
            '#7c3aed',
            '#be185d',
            '#be123c',
            '#c2410c',
            '#0369a1',
            '#047857',
            '#0f766e',
        ];
        palette.should.contain(getAvatarColor('AB'));
    });
});
