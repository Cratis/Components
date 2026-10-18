// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form, sampleGuid, type SampleOptionalGuidCommand } from '../given/a_guid_form';

describe('when resetting a draft by reverting the command', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({ initialValues: { sampleId: Guid.parse(sampleGuid) } });
        await form.edit('partial');
        await act(async () => {
            form.context.commandInstance.revertChanges();
            form.context.setCommandValues({} as SampleOptionalGuidCommand);
        });
    });

    it('should show the baseline identifier', () => form.input.value.should.equal(sampleGuid));
    it('should clear the format error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
}));
