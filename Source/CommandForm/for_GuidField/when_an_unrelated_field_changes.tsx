// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { a_guid_form } from './given/a_guid_form';

describe('when an unrelated field changes during a partial draft', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render();
        await form.edit('partial');
        await form.edit('Example User', form.container.querySelector<HTMLInputElement>('input[aria-label="Name"]')!);
    });

    it('should keep the draft', () => form.input.value.should.equal('partial'));
    it('should keep the format error', () => form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.'));
}));
