// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { an_invalid_optional_draft } from './given/an_invalid_optional_draft';

describe('when submit follows successive invalid edits before the context rerenders', given(an_invalid_optional_draft, form => {
    beforeEach(async () => {
        await act(async () => {
            form.type('still partial');
            form.clickSubmit();
        });
    });

    it('should not reach HTTP', () => form.http.callCount.should.equal(0));
}));
