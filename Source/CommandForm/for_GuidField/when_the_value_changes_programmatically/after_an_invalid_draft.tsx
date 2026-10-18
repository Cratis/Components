// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, exampleGuid, type SampleOptionalGuidCommand } from '../given/a_guid_form';

describe('when the value changes programmatically after an invalid draft', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render();
        await form.edit('partial');
        await act(async () => form.context.setCommandValues({ sampleId: Guid.parse(exampleGuid) } as SampleOptionalGuidCommand));
        await form.submit();
    });

    it('should replace the stale draft', () => form.input.value.should.equal(exampleGuid));
    it('should clear the stale format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
    it('should submit the programmatic value', () => form.submittedBody.should.deep.equal({ sampleId: exampleGuid, name: 'Sample User' }));
}));
