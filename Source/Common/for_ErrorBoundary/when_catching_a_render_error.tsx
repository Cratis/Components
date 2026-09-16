// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it } from 'vitest';
import { a_boundary, FailingChild } from './given/a_boundary';

describe('when catching a render error', () => {
    let context: a_boundary;
    let failure: Error;

    beforeEach(async () => {
        context = new a_boundary();
        failure = new Error('Private example identifier 123');
        failure.stack = 'Private stack at /example/internal/file.ts:10';
        await context.render(<FailingChild failure={failure} />);
    });

    afterEach(async () => context.dispose());

    it('should keep error messages and stacks out of the entire rendered markup', () => {
        context.container.innerHTML.should.not.contain(failure.message);
        context.container.innerHTML.should.not.contain(failure.stack!);
    });

    it('should announce a neutral recovery message', () => {
        const alert = context.container.querySelector('[role="alert"]');
        String(alert?.textContent).should.contain('Something went wrong. Please try again.');
    });

    it('should offer a non-submitting retry button', () => {
        const button = context.container.querySelector('button');
        String(button?.textContent).should.equal('Try again');
        String(button?.getAttribute('type')).should.equal('button');
    });

    it('should retain diagnostics in the default console reporter', () => {
        context.loggedErrors.calledOnce.should.equal(true);
        context.loggedErrors.firstCall.args[0].should.equal('Uncaught error:');
        context.loggedErrors.firstCall.args[1].should.equal(failure);
        context.loggedErrors.firstCall.args[2].componentStack.should.contain('FailingChild');
    });
});

describe('when a child throws a value other than an Error', () => {
    let context: a_boundary;

    beforeEach(() => { context = new a_boundary(); });
    afterEach(async () => context.dispose());

    for (const failure of ['private example text', null, undefined, { detail: 'private example detail' }]) {
        it(`should recover safely from a thrown ${failure === null ? 'null' : typeof failure}`, async () => {
            await context.render(<FailingChild failure={failure} />);
            context.container.textContent!.should.contain('Something went wrong. Please try again.');
            context.container.innerHTML.should.not.contain('private example');
            context.caughtErrors.calledOnce.should.equal(true);
        });
    }
});

describe('when no descendant fails', () => {
    let context: a_boundary;

    beforeEach(async () => {
        context = new a_boundary();
        await context.render(<p>Working content</p>);
    });
    afterEach(async () => context.dispose());

    it('should render children without extra markup', () => {
        context.container.innerHTML.should.equal('<p>Working content</p>');
    });

    it('should not report an error', () => {
        context.loggedErrors.called.should.equal(false);
        context.caughtErrors.called.should.equal(false);
    });
});
