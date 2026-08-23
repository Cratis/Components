// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describe, it } from 'vitest';
import { hasScrollableOverflow } from '../isWithinScrollableContent';

describe('when deciding whether an elements overflow is scrollable', () => {
    it('should be scrollable when overflow-y is auto and content exceeds the box', () => {
        hasScrollableOverflow({ overflowX: 'visible', overflowY: 'auto', scrollWidth: 100, clientWidth: 100, scrollHeight: 400, clientHeight: 200 }).should.be.true;
    });

    it('should be scrollable when overflow-y is scroll and content exceeds the box', () => {
        hasScrollableOverflow({ overflowX: 'visible', overflowY: 'scroll', scrollWidth: 100, clientWidth: 100, scrollHeight: 400, clientHeight: 200 }).should.be.true;
    });

    it('should be scrollable when overflow-x is auto and content exceeds the box', () => {
        hasScrollableOverflow({ overflowX: 'auto', overflowY: 'visible', scrollWidth: 400, clientWidth: 200, scrollHeight: 100, clientHeight: 100 }).should.be.true;
    });

    it('should not be scrollable when overflow is auto but content fits the box', () => {
        hasScrollableOverflow({ overflowX: 'visible', overflowY: 'auto', scrollWidth: 100, clientWidth: 100, scrollHeight: 200, clientHeight: 200 }).should.be.false;
    });

    it('should not be scrollable when content overflows but overflow is visible', () => {
        hasScrollableOverflow({ overflowX: 'visible', overflowY: 'visible', scrollWidth: 100, clientWidth: 100, scrollHeight: 400, clientHeight: 200 }).should.be.false;
    });

    it('should not be scrollable when overflow is hidden even though content overflows', () => {
        hasScrollableOverflow({ overflowX: 'hidden', overflowY: 'hidden', scrollWidth: 400, clientWidth: 200, scrollHeight: 400, clientHeight: 200 }).should.be.false;
    });
});
