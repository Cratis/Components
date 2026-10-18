// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { sampleGuid } from '../given/a_guid_form';
import { an_invalid_optional_draft } from './given/an_invalid_optional_draft';

describe('when submit happens in the same event batch as an invalid edit', given(an_invalid_optional_draft, form => {
    beforeEach(async () => {
        await form.edit(sampleGuid);
        await act(async () => {
            form.type('partial');
            form.clickSubmit();
        });
    });

    it('should not reach HTTP', () => form.http.callCount.should.equal(0));
}));
