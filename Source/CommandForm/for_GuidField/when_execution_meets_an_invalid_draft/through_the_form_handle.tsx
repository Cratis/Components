// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import type { ICommandResult } from '@cratis/arc/commands';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { an_invalid_optional_draft } from './given/an_invalid_optional_draft';

describe('when a captured form handle executes an invalid optional draft', given(an_invalid_optional_draft, form => {
    let valid: boolean;
    let result: ICommandResult<unknown>;

    beforeEach(async () => {
        const handle = form.formRef.current!;
        valid = handle.isValid;
        await act(async () => { result = await handle.execute(); });
    });

    it('should report the handle invalid', () => valid.should.be.false);
    it('should not reach HTTP', () => form.http.callCount.should.equal(0));
    it('should not succeed', () => result.isSuccess.should.be.false);
    it('should return an invalid result', () => result.isValid.should.be.false);
    it('should name the Guid property', () => result.validationResults.some((entry) => entry.members.includes('sampleId')).should.be.true);
    it('should store the invalid result', () => form.context.commandResult!.isValid.should.be.false);
}));
