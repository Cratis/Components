// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../given';
import { a_guid_form, sampleGuid } from './given/a_guid_form';

describe('when editing a partial draft over a valid Guid', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ currentValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('852a');
        await form.submit();
    });

    it('should keep the draft editable', () => form.input.value.should.equal('852a'));
    it('should remove the previous identifier from the command', () => (form.context.commandInstance.sampleId === undefined).should.be.true);
    it('should report the format error', () => form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.'));
    it('should mark the input invalid', () => form.input.getAttribute('aria-invalid')!.should.equal('true'));
    it('should describe the input with the format error', () =>
        document.getElementById(form.input.getAttribute('aria-describedby')!)!.textContent!.should.equal('Enter a valid Guid.'));
    it('should not submit', () => form.http.callCount.should.equal(0));
    it('should report a validation failure', () => form.validationFailures.should.equal(1));
}));
