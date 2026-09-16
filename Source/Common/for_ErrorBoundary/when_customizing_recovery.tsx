// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { type ReactNode } from 'react';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { a_boundary, FailingChild } from './given/a_boundary';

describe('when customizing recovery', () => {
    let context: a_boundary;
    const failure = new Error('Example diagnostic detail');

    beforeEach(() => { context = new a_boundary(); });
    afterEach(async () => context.dispose());

    it('should render an explicitly supplied static fallback', async () => {
        await context.render(<FailingChild failure={failure} />, { fallback: <p>Section unavailable</p> });
        context.container.innerHTML.should.equal('<p>Section unavailable</p>');
    });

    it('should respect an intentionally empty fallback', async () => {
        await context.render(<FailingChild failure={failure} />, { fallback: null });
        context.container.innerHTML.should.equal('');
    });

    it('should pass only a reset action to a custom fallback and support recovery', async () => {
        let failed = true;
        function Child() {
            if (failed) throw failure;
            return <p>Recovered</p>;
        }
        const fallback = sinon.spy((reset: () => void): ReactNode => <button type='button' onClick={reset}>Retry section</button>);
        await context.render(<Child />, { fallback, onReset: () => { failed = false; } });
        fallback.firstCall.args.should.have.lengthOf(1);
        (typeof fallback.firstCall.args[0]).should.equal('function');
        await context.click('Retry section');
        context.container.textContent!.should.equal('Recovered');
    });

    it('should send diagnostics to the supplied reporter instead of the default console reporter', async () => {
        const onError = sinon.spy();
        await context.render(<FailingChild failure={failure} />, { onError });
        onError.calledOnce.should.equal(true);
        onError.firstCall.args[0].should.equal(failure);
        onError.firstCall.args[1].componentStack.should.contain('FailingChild');
        context.loggedErrors.called.should.equal(false);
        context.container.innerHTML.should.not.contain(failure.message);
    });

    it('should not call recovery hooks or render a fallback for healthy children', async () => {
        const fallback = sinon.spy(() => <p>Unexpected fallback</p>);
        const onReset = sinon.spy();
        const onError = sinon.spy();
        await context.render(<p>Healthy</p>, { fallback, onReset, onError });
        fallback.called.should.equal(false);
        onReset.called.should.equal(false);
        onError.called.should.equal(false);
    });

    it('should allow an ancestor boundary to handle a failing custom fallback', async () => {
        const fallbackFailure = new Error('Example fallback failure');
        const onOuterError = sinon.spy();
        await context.renderTree(
            <ErrorBoundary onError={onOuterError}>
                <ErrorBoundary fallback={() => { throw fallbackFailure; }}>
                    <FailingChild failure={failure} />
                </ErrorBoundary>
            </ErrorBoundary>,
        );
        onOuterError.calledOnce.should.equal(true);
        onOuterError.firstCall.args[0].should.equal(fallbackFailure);
        context.container.innerHTML.should.not.contain(fallbackFailure.message);
        context.container.textContent!.should.contain('Try again');
    });
});
