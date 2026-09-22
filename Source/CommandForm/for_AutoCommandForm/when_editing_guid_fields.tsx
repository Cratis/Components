// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { GuidField, type GuidFieldProps } from '../fields/GuidField';
import { registerFieldTypeProvider } from '../fieldTypeProviderRegistry';
import { SampleGuidCommand } from './given/SampleGuidCommand';
import { a_guid_form, sampleGuid, exampleGuid, SampleOptionalGuidCommand } from './given/a_guid_form';

// These are field/binding gates, separate from the upstream custom-error execution regressions.
describe('when editing native Guid fields in an automatic command form', () => {
    let form: a_guid_form;
    beforeEach(() => { form = new a_guid_form(); form.setup(); });
    afterEach(async () => form.cleanup());

    it('should parse text into a native Guid and serialize its value through native execute', async () => {
        await form.render();
        await form.edit(sampleGuid);
        form.context.commandInstance.sampleId!.should.be.instanceOf(Guid);
        form.context.commandInstance.sampleId!.toString().should.equal(sampleGuid);
        await form.submit();
        form.http.callCount.should.equal(1);
        JSON.parse(String(form.http.firstCall.args[1]!.body)).should.deep.equal({ sampleId: sampleGuid, name: 'Sample User' });
    });

    it('should retain partial and invalid drafts while immediately removing the old identifier', async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        for (const text of ['852a', 'not a Guid', ' ']) {
            await form.edit(text);
            form.input.value.should.equal(text);
            (form.context.commandInstance.sampleId === undefined).should.equal(true);
            form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.');
            form.input.getAttribute('aria-invalid')!.should.equal('true');
            document.getElementById(form.input.getAttribute('aria-describedby')!)!.textContent!.should.equal('Enter a valid Guid.');
        }
    });

    it('should preserve an invalid draft when an unrelated field changes', async () => {
        await form.render();
        await form.edit('partial');
        await form.edit('Example User', form.container.querySelector<HTMLInputElement>('input[aria-label="Name"]')!);
        form.input.value.should.equal('partial');
        form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.');
    });

    it('should retain format validation when an empty custom message is supplied', async () => {
        function ExampleGuidField(props: GuidFieldProps) { return <GuidField {...props} formatErrorMessage='' />; }
        registerFieldTypeProvider({ canHandle: (descriptor) => descriptor.type === Guid, component: ExampleGuidField });
        await form.render();
        await form.edit('partial');
        form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.');
    });

    it('should allow optional empty values without a format error or generated identifier', async () => {
        await form.render();
        form.input.value.should.equal('');
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
        (form.context.commandInstance.sampleId === undefined).should.equal(true);
        await form.submit();
        form.http.callCount.should.equal(1);
        JSON.parse(String(form.http.firstCall.args[1]!.body)).should.deep.equal({ name: 'Sample User' });
    });

    it('should report required empty values through the actual context and native validation', async () => {
        await form.render({ command: SampleGuidCommand });
        form.context.customFieldErrors.sampleId.should.equal('A value is required.');
        form.input.getAttribute('aria-required')!.should.equal('true');
        await form.submit();
        form.http.callCount.should.equal(0);
        form.validationFailures.should.equal(1);
    });

    it('should clear an edited optional identifier and its format error', async () => {
        await form.render();
        await form.edit(sampleGuid);
        await form.edit('partial');
        await form.edit('');
        form.input.value.should.equal('');
        (form.context.commandInstance.sampleId === undefined).should.equal(true);
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
        await form.submit();
        JSON.parse(String(form.http.firstCall.args[1]!.body)).should.deep.equal({ name: 'Sample User' });
    });

    it('should repopulate after invalid input and clear external values', async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await form.render({ currentValues: { sampleId: Guid.parse(exampleGuid) } });
        form.input.value.should.equal(exampleGuid);
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
        await form.render({ currentValues: { sampleId: undefined } });
        form.input.value.should.equal('');
        (form.context.commandInstance.sampleId === undefined).should.equal(true);
    });

    it('should clear an invalid draft when the external overlay changes to empty', async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await form.render({ currentValues: { sampleId: undefined } });
        form.input.value.should.equal('');
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
    });

    it('should keep a draft when an equivalent Guid overlay is recreated', async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        form.input.value.should.equal('partial');
    });

    it('should restore the baseline when the command is reverted and the form is refreshed', async () => {
        await form.render({ initialValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await act(async () => {
            form.context.commandInstance.revertChanges();
            form.context.setCommandValues({} as SampleOptionalGuidCommand);
        });
        form.input.value.should.equal(sampleGuid);
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
    });

    it('should discard a same-empty-value draft when the explicit reset key changes', async () => {
        let resetKey = 0;
        function ExampleGuidField(props: GuidFieldProps) { return <GuidField {...props} resetKey={resetKey} />; }
        registerFieldTypeProvider({ canHandle: (descriptor) => descriptor.type === Guid, component: ExampleGuidField });
        await form.render();
        await form.edit('partial');
        resetKey++;
        await form.render();
        form.input.value.should.equal('');
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
    });

    it('should accept zero and unrestricted version bits without an implicit constraint', async () => {
        await form.render();
        for (const text of [Guid.empty.toString(), 'ABCDEF01-2345-F678-FFFF-0123456789AB']) {
            await form.edit(text);
            form.context.commandInstance.sampleId!.should.be.instanceOf(Guid);
            form.context.commandInstance.sampleId!.toString().should.equal(text.toLowerCase());
            (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
        }
    });

    it('should let a later provider override Guid presentation while retaining its native binding', async () => {
        function ExampleGuidField(props: GuidFieldProps) { return <GuidField {...props} placeholder='Example identifier' />; }
        registerFieldTypeProvider({ canHandle: (descriptor) => descriptor.type === Guid, component: ExampleGuidField });
        await form.render();
        form.input.placeholder.should.equal('Example identifier');
        await form.edit(exampleGuid);
        await form.submit();
        JSON.parse(String(form.http.firstCall.args[1]!.body)).sampleId.should.equal(exampleGuid);
    });

    it('should clean up owned validation errors when the Guid field is excluded and unmounted', async () => {
        await form.render();
        await form.edit('partial');
        await form.render({ exclude: ['sampleId'] });
        (form.input === null).should.equal(true);
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
        await form.submit();
        form.http.callCount.should.equal(1);
    });

    it('should remove an error published by the edit that excludes the optional Guid field', async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } }, true);
        await form.edit('partial');
        (form.input === null).should.equal(true);
        (form.context.commandInstance.sampleId === undefined).should.equal(true);
        (form.context.customFieldErrors.sampleId === undefined).should.equal(true);
        await form.submit();
        form.http.callCount.should.equal(1);
        JSON.parse(String(form.http.firstCall.args[1]!.body)).should.deep.equal({ name: 'Sample User' });
    });

    it('should preserve a caller error when a valid edit excludes the optional Guid field', async () => {
        await form.render({ onFieldValidate: () => 'Example validation message' }, true);
        await form.edit(exampleGuid);
        (form.input === null).should.equal(true);
        form.context.customFieldErrors.sampleId.should.equal('Example validation message');
    });

    it('should preserve a caller replacement made in the same batch as exclusion', async () => {
        await form.render();
        await form.edit('partial');
        await act(async () => {
            form.context.setCustomFieldError('sampleId', 'Example replacement message');
            await form.render({ exclude: ['sampleId'] });
        });
        (form.input === null).should.equal(true);
        form.context.customFieldErrors.sampleId.should.equal('Example replacement message');
    });

    it('should preserve a caller replacement after publication and before any field rerender', async () => {
        await form.render({}, true);
        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(form.input, 'partial');
            form.input.dispatchEvent(new Event('input', { bubbles: true }));
            form.context.setCustomFieldError('sampleId', 'Example replacement message');
        });
        (form.input === null).should.equal(true);
        form.context.customFieldErrors.sampleId.should.equal('Example replacement message');
    });

    it('should not clear caller-owned validation errors on a valid edit or unmount', async () => {
        const onFieldValidate = () => 'Example validation message';
        await form.render({ onFieldValidate });
        await form.edit('partial');
        await form.edit(exampleGuid);
        form.context.customFieldErrors.sampleId.should.equal('Example validation message');
        await form.render({ onFieldValidate, exclude: ['sampleId'] });
        form.context.customFieldErrors.sampleId.should.equal('Example validation message');
    });
});
