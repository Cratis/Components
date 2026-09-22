// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useCommandFormContext } from '@cratis/arc.react/commands';
import { Guid } from '@cratis/fundamentals';
import sinon from 'sinon';
import type {} from 'chai/register-should';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { AutoCommandForm } from '../AutoCommandForm';
import { SampleGuidCommand, sampleId } from './given/SampleGuidCommand';

function Submit() {
    const { commandInstance, isExecuting } = useCommandFormContext<SampleGuidCommand>();
    return <button type='submit' disabled={isExecuting}>Submit {commandInstance.name}</button>;
}

// No command, form, field, context or executor mocks: only the HTTP boundary is substituted.
describe('when composing a footer inside the automatic command form', () => {
    let container: HTMLDivElement;
    let root: Root;
    let http: sinon.SinonStub<Parameters<typeof fetch>, ReturnType<typeof fetch>>;
    let submitted: SampleGuidCommand | undefined;
    let validationFailures: number;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        submitted = undefined;
        validationFailures = 0;
        http = sinon.stub(globalThis, 'fetch').callsFake(async () => new Response(JSON.stringify({
            correlationId: Guid.empty.toString(),
            isSuccess: true,
            isAuthorized: true,
            isValid: true,
            hasExceptions: false,
            validationResults: [],
            exceptionMessages: [],
            exceptionStackTrace: '',
            authorizationFailureReason: '',
        }), { status: 200 }));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        http.restore();
    });

    const render = async (footer?: ReactNode, currentValues: Partial<SampleGuidCommand> = { sampleId }) => {
        await act(async () => root.render(
            <AutoCommandForm
                command={SampleGuidCommand}
                currentValues={currentValues}
                footer={footer}
                onBeforeExecute={(command) => { submitted = command; return command; }}
                onValidationFailure={() => { validationFailures++; }}
            />,
        ));
    };

    const submit = async () => {
        await act(async () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
    };

    it('should keep the default fields-only form without a submit control', async () => {
        await render();
        container.querySelectorAll('form').length.should.equal(1);
        container.querySelectorAll('input').length.should.equal(2);
        container.querySelectorAll('button').length.should.equal(0);
        http.callCount.should.equal(0);
    });

    it('should place the footer after the fields inside the same native form', async () => {
        await render(<Submit />);
        const form = container.querySelector('form')!;
        const input = container.querySelector('input')!;
        const button = container.querySelector('button')!;
        (button.form === form).should.equal(true);
        Boolean(input.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).should.equal(true);
        button.textContent!.should.equal('Submit Sample User');
        container.querySelectorAll('form').length.should.equal(1);
    });

    it('should submit the typed Guid and edited string through native Command execute', async () => {
        await render(<Submit />);
        const input = container.querySelector<HTMLInputElement>('input[aria-label="Name"]')!;
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Sample User Updated');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        container.querySelector('button')!.textContent!.should.equal('Submit Sample User Updated');
        await submit();
        http.callCount.should.equal(1);
        submitted!.sampleId!.should.be.instanceOf(Guid);
        new URL(String(http.firstCall.args[0])).pathname.should.equal('/api/sample-command');
        JSON.parse(String(http.firstCall.args[1]!.body)).should.deep.equal({
            sampleId: sampleId.toString(), name: 'Sample User Updated',
        });
    });

    it('should retain native required-value validation before reaching HTTP', async () => {
        await render(<Submit />, { sampleId: undefined });
        await submit();
        http.callCount.should.equal(0);
        validationFailures.should.equal(1);
    });

    it('should clear and repopulate command values without replacing the native executor', async () => {
        await render(<Submit />);
        await render(<Submit />, { sampleId: undefined });
        await submit();
        http.callCount.should.equal(0);
        const repopulated = Guid.parse('4b4869e3-900e-4342-9656-7ad675e43e9f');
        await render(<Submit />, { sampleId: repopulated });
        await submit();
        http.callCount.should.equal(1);
        submitted!.sampleId!.should.be.instanceOf(Guid);
        JSON.parse(String(http.firstCall.args[1]!.body)).sampleId.should.equal(repopulated.toString());
    });

    it('should allow non-action content without adding a submit control', async () => {
        await render(<p>Example content</p>);
        container.querySelector('form p')!.textContent!.should.equal('Example content');
        container.querySelectorAll('button').length.should.equal(0);
        http.callCount.should.equal(0);
    });
});
