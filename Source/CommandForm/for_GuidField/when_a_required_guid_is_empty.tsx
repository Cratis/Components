// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { a_guid_form, SampleRequiredGuidCommand } from './given/a_guid_form';

describe('when a required Guid is empty', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ command: SampleRequiredGuidCommand });
        await form.submit();
    });

    it('should not generate an identifier', () => form.input.value.should.equal(''));
    it('should report the required error', () => form.context.customFieldErrors.sampleId.should.equal('A value is required.'));
    it('should mark the input required', () => form.input.getAttribute('aria-required')!.should.equal('true'));
    it('should not submit', () => form.http.callCount.should.equal(0));
    it('should report a validation failure', () => form.validationFailures.should.equal(1));
}));
