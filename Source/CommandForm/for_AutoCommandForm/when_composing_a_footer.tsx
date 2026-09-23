// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Command } from '@cratis/arc/commands';
import { PropertyDescriptor } from '@cratis/arc/reflection';
import { useCommandFormContext } from '@cratis/arc.react/commands';
import sinon from 'sinon';
import type {} from 'chai/register-should';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { AutoCommandForm } from '../AutoCommandForm';

// An independently authored string-only command for the footer composition contract.
class SampleCommand extends Command {
    readonly route = '/api/example-command';
    readonly propertyDescriptors = [new PropertyDescriptor('name', String)];
    name = 'Sample User';

    get requestParameters(): string[] { return []; }

    constructor() { super(Object, false); }
}

function Submit() {
    const { commandInstance, isExecuting } = useCommandFormContext<SampleCommand>();
    return <button type='submit' disabled={isExecuting}>Submit {commandInstance.name}</button>;
}

// Real React, Arc form, context, and executor; only the HTTP boundary is substituted.
describe('when composing a footer inside the automatic command form', () => {
    let container: HTMLDivElement;
    let root: Root;
    let http: sinon.SinonStub<Parameters<typeof fetch>, ReturnType<typeof fetch>>;
    let submitted: SampleCommand | undefined;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        submitted = undefined;
        http = sinon.stub(globalThis, 'fetch').callsFake(async () => new Response(JSON.stringify({
            correlationId: '00000000-0000-0000-0000-000000000000',
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

    const render = async (footer?: ReactNode) => {
        await act(async () => root.render(
            <AutoCommandForm
                command={SampleCommand}
                footer={footer}
                onBeforeExecute={(command) => { submitted = command; return command; }}
            />,
        ));
    };

    it('should keep the default fields-only form without a submit control', async () => {
        await render();
        container.querySelectorAll('form').length.should.equal(1);
        container.querySelectorAll('input').length.should.equal(1);
        container.querySelectorAll('button').length.should.equal(0);
        http.callCount.should.equal(0);
    });

    it('should place the footer after the field inside the same native form and context', async () => {
        await render(<Submit />);
        const form = container.querySelector('form')!;
        const input = container.querySelector('input')!;
        const button = container.querySelector('button')!;
        (button.form === form).should.equal(true);
        Boolean(input.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).should.equal(true);
        button.textContent!.should.equal('Submit Sample User');
        container.querySelectorAll('form').length.should.equal(1);
    });

    it('should submit the edited string through the native command executor', async () => {
        await render(<Submit />);
        const input = container.querySelector<HTMLInputElement>('input[aria-label="Name"]')!;
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Example Updated');
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        container.querySelector('button')!.textContent!.should.equal('Submit Example Updated');
        await act(async () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click());
        http.callCount.should.equal(1);
        submitted!.name.should.equal('Example Updated');
        new URL(String(http.firstCall.args[0])).pathname.should.equal('/api/example-command');
        JSON.parse(String(http.firstCall.args[1]!.body)).should.deep.equal({ name: 'Example Updated' });
    });

    it('should allow non-action content without adding a submit control', async () => {
        await render(<p>Example content</p>);
        container.querySelector('form p')!.textContent!.should.equal('Example content');
        container.querySelectorAll('button').length.should.equal(0);
        http.callCount.should.equal(0);
    });
});
