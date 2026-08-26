// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRequestCorrelator } from '../engine/requestCorrelator';

describe('when two overlapping requests resolve out of order', () => {
    const correlator = createRequestCorrelator<string>();

    const firstRequestId = correlator.nextId();
    const secondRequestId = correlator.nextId();

    let firstResult: string | undefined;
    let secondResult: string | undefined;

    correlator.register(firstRequestId, (result) => {
        firstResult = result;
    });
    correlator.register(secondRequestId, (result) => {
        secondResult = result;
    });

    // Simulate the worker responding to the second request before the first.
    correlator.resolve(secondRequestId, 'second-response');
    correlator.resolve(firstRequestId, 'first-response');

    it('should resolve the second request with its own response despite arriving first', () => {
        (secondResult as string).should.equal('second-response');
    });

    it('should resolve the first request with its own response despite arriving last', () => {
        (firstResult as string).should.equal('first-response');
    });

    it('should no longer report either request as pending once resolved', () => {
        correlator.isPending(firstRequestId).should.be.false;
        correlator.isPending(secondRequestId).should.be.false;
    });
});
