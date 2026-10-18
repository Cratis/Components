// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { sampleGuid, successfulResponse } from '../given/a_guid_form';
import { an_invalid_optional_draft } from './given/an_invalid_optional_draft';

describe('when an older successful silent validation completes after an invalid edit', given(an_invalid_optional_draft, form => {
    beforeEach(async () => {
        await form.edit(sampleGuid);
        let complete!: (response: Response) => void;
        form.http.callsFake(() => new Promise<Response>((resolve) => { complete = resolve; }));
        const issue = form.context.beginSilentValidation();
        const pending = form.context.commandInstance.validate();
        await act(async () => { await Promise.resolve(); });
        await form.edit('partial');
        await act(async () => {
            complete(successfulResponse());
            form.context.setSilentValidationResult(await pending, issue);
        });
    });

    it('should keep the draft', () => form.input.value.should.equal('partial'));
    it('should keep the format error', () => form.context.customFieldErrors.sampleId.should.equal('Enter a valid Guid.'));
    it('should keep the form invalid', () => form.context.isValid.should.be.false);
}));
