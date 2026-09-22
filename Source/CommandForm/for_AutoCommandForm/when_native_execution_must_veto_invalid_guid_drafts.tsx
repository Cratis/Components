// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { Guid } from '@cratis/fundamentals';
import type { ICommandResult } from '@cratis/arc/commands';
import type {} from 'chai/register-should';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { a_guid_form, sampleGuid, successfulResponse } from './given/a_guid_form';

// Native execution regressions for Arc React's custom-error guard, required since 22.19.1.
// Keep the real context, handle and command executor: presentation alone is not a validation gate.
describe('when native execution must veto an invalid optional Guid draft', () => {
    let form: a_guid_form;
    beforeEach(async () => {
        form = new a_guid_form();
        form.setup();
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
    });
    afterEach(async () => form.cleanup());

    it('should veto DOM form submit before HTTP despite the optional command value being empty', async () => {
        await form.submit();
        form.http.callCount.should.equal(0);
        form.validationFailures.should.equal(1);
    });

    it('should veto submit in the same event batch as an invalid edit', async () => {
        await form.edit(sampleGuid);
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(form.input, 'partial');
            form.input.dispatchEvent(new Event('input', { bubbles: true }));
            form.container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
        });
        form.http.callCount.should.equal(0);
    });

    it('should keep the veto during successive invalid edits before context rerenders', async () => {
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(form.input, 'still partial');
            form.input.dispatchEvent(new Event('input', { bubbles: true }));
            form.container.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
        });
        form.http.callCount.should.equal(0);
    });

    it('should veto execution through the actual command form context', async () => {
        await act(async () => { await form.context.onExecute!(); });
        form.http.callCount.should.equal(0);
    });

    it('should veto execution through a captured native form handle', async () => {
        const handle = form.formRef.current!;
        await act(async () => { await handle.execute(); });
        form.http.callCount.should.equal(0);
    });

    it('should expose custom format errors in native context and handle validity', () => {
        form.context.isValid.should.equal(false);
        form.formRef.current!.isValid.should.equal(false);
    });

    it('should return and store a validation failure instead of a successful execution result', async () => {
        let result!: ICommandResult<unknown>;
        await act(async () => { result = await form.formRef.current!.execute(); });
        result.isSuccess.should.equal(false);
        result.isValid.should.equal(false);
        result.validationResults.some((entry) => entry.members.includes('sampleId')).should.equal(true);
        form.context.commandResult!.isValid.should.equal(false);
    });

    it('should retain invalid state when an older successful silent HTTP validation completes', async () => {
        await form.edit(sampleGuid);
        let complete!: (response: Response) => void;
        form.http.callsFake(() => new Promise<Response>((resolve) => { complete = resolve; }));
        const issue = form.context.beginSilentValidation();
        const pending = form.context.commandInstance.validate();
        // Native validate reaches the substituted HTTP boundary without replacing any validation method.
        await act(async () => { await Promise.resolve(); });
        await form.edit('partial');
        await act(async () => {
            complete(successfulResponse());
            form.context.setSilentValidationResult(await pending, issue);
        });
        form.input.value.should.equal('partial');
        form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.');
        form.context.isValid.should.equal(false);
    });
});
