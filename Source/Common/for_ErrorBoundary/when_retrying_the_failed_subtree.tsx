// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { useState } from 'react';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { a_boundary, FailingChild } from './given/a_boundary';

function RecoverableChild() {
    const [failed, setFailed] = useState(false);
    if (failed) throw new Error('Example render failure');
    return <button type='button' onClick={() => setFailed(true)}>Trigger failure</button>;
}

function Sibling() {
    const [count, setCount] = useState(0);
    return <button type='button' onClick={() => setCount(count + 1)}>Count {count}</button>;
}

describe('when retrying the failed subtree', () => {
    let context: a_boundary;

    beforeEach(async () => {
        context = new a_boundary();
        await context.renderTree(<><Sibling /><ErrorBoundary><RecoverableChild /></ErrorBoundary></>);
        await context.click('Count 0');
        await context.click('Trigger failure');
        await context.click('Try again');
    });
    afterEach(async () => context.dispose());

    it('should remount the failed children without reloading the page', () => {
        context.container.textContent!.should.contain('Trigger failure');
        context.container.textContent!.should.not.contain('Something went wrong');
    });

    it('should preserve state outside the boundary', () => {
        context.container.textContent!.should.contain('Count 1');
    });

    it('should catch another failure after recovery', async () => {
        await context.click('Trigger failure');
        context.container.textContent!.should.contain('Try again');
        context.loggedErrors.callCount.should.equal(2);
    });
});

describe('when the cause of failure persists', () => {
    let context: a_boundary;

    beforeEach(async () => {
        context = new a_boundary();
        await context.render(<FailingChild failure={new Error('Example persistent failure')} />);
        await context.click('Try again');
    });
    afterEach(async () => context.dispose());

    it('should return to the safe fallback without an automatic retry loop', () => {
        context.container.textContent!.should.contain('Something went wrong. Please try again.');
        context.loggedErrors.callCount.should.equal(2);
    });
});

describe('when the host resets the cause before retrying', () => {
    let context: a_boundary;
    let onReset: sinon.SinonSpy;

    beforeEach(async () => {
        context = new a_boundary();
        let failed = true;
        function HostControlledChild() {
            if (failed) throw new Error('Example host-controlled failure');
            return <p>Recovered content</p>;
        }
        onReset = sinon.spy(() => { failed = false; });
        await context.render(<HostControlledChild />, { onReset });
        await context.click('Try again');
    });
    afterEach(async () => context.dispose());

    it('should call the host reset callback once before remounting children', () => {
        onReset.calledOnce.should.equal(true);
        context.container.textContent!.should.equal('Recovered content');
    });
});
