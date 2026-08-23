// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import sinon from 'sinon';
import { canvasTransformActivity } from '../canvasTransformActivity';

describe('when a listener is subscribed', () => {
    let listener: sinon.SinonStub;
    let unsubscribe: () => void;

    beforeEach(() => {
        listener = sinon.stub();
        unsubscribe = canvasTransformActivity.subscribe(listener);
        canvasTransformActivity.notify();
        canvasTransformActivity.notify();
    });

    afterEach(() => unsubscribe());

    it('should invoke the listener once per applied transform frame', () => listener.callCount.should.equal(2));
});

describe('when a listener has unsubscribed', () => {
    let listener: sinon.SinonStub;

    beforeEach(() => {
        listener = sinon.stub();
        const unsubscribe = canvasTransformActivity.subscribe(listener);
        unsubscribe();
        canvasTransformActivity.notify();
    });

    it('should not invoke the listener', () => listener.called.should.be.false);
});

describe('when notifying with no listeners', () => {
    it('should not throw', () => {
        (() => canvasTransformActivity.notify()).should.not.throw();
    });
});
