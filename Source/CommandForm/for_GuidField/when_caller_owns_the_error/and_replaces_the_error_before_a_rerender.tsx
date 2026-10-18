// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { a_guid_form } from '../given/a_guid_form';

describe('when a caller replaces a just-published error before the field rerenders', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render({}, true);
        await act(async () => {
            form.type('partial');
            form.context.setCustomFieldError('sampleId', 'Example replacement message');
        });
    });

    it('should unmount the field', () => (form.input === null).should.be.true);
    it('should keep the caller replacement', () => form.context.customFieldErrors.sampleId.should.equal('Example replacement message'));
}));
