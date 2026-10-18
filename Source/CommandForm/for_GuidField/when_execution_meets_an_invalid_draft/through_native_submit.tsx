// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../../given';
import { an_invalid_optional_draft } from './given/an_invalid_optional_draft';

// Arc React 22.19.1+ refuses execution while a custom field error exists; presentation alone is not a gate.
describe('when native submit meets an invalid optional draft', given(an_invalid_optional_draft, form => {
    beforeEach(async () => form.submit());

    it('should not reach HTTP', () => form.http.callCount.should.equal(0));
    it('should report a validation failure', () => form.validationFailures.should.equal(1));
}));
