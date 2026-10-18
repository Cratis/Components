// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form } from '../given/a_guid_form';

describe('when a caller replaces the field error in the same batch as exclusion', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render();
        await form.edit('partial');
        await act(async () => {
            form.context.setCustomFieldError('sampleId', 'Example replacement message');
            await form.render({ exclude: ['sampleId'] });
        });
    });

    it('should unmount the field', () => (form.input === null).should.be.true);
    it('should keep the caller replacement', () => form.context.customFieldErrors.sampleId.should.equal('Example replacement message'));
}));
