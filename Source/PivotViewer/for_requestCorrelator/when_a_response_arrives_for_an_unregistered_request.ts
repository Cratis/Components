// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRequestCorrelator } from '../engine/requestCorrelator';

describe('when a response arrives for an unregistered or already-resolved request id', () => {
    const correlator = createRequestCorrelator<string>();
    const requestId = correlator.nextId();

    let callCount = 0;
    correlator.register(requestId, () => {
        callCount++;
    });

    it('should resolve and report success the first time', () => {
        correlator.resolve(requestId, 'value').should.be.true;
        callCount.should.equal(1);
    });

    it('should report failure without invoking a callback again for a duplicate/stale response', () => {
        correlator.resolve(requestId, 'stale-value').should.be.false;
        callCount.should.equal(1);
    });

    it('should report failure for a request id that was never registered', () => {
        correlator.resolve(9999, 'never-registered').should.be.false;
    });
});
