// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, sampleGuid, SampleRequiredGuidCommand, type SampleOptionalGuidCommand } from '../given/a_guid_form';

describe('when a required value changes programmatically to empty after a valid edit', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ command: SampleRequiredGuidCommand });
        await form.edit(sampleGuid);
        await act(async () => form.context.setCommandValues({ sampleId: undefined } as unknown as SampleOptionalGuidCommand));
        await form.submit();
    });

    it('should not keep the stale identifier text', () => form.input.value.should.equal(''));
    it('should report the required error', () => form.context.customFieldErrors.sampleId.should.equal('A value is required.'));
    it('should not submit', () => form.http.callCount.should.equal(0));
}));
