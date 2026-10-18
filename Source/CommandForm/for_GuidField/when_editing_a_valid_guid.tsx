// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../given';
import { a_guid_form, sampleGuid } from './given/a_guid_form';

describe('when editing a valid Guid', given(a_guid_form, form => {
    beforeEach(async () => {
        await form.render();
        await form.edit(sampleGuid);
        await form.submit();
    });

    it('should write a native Guid to the command', () => form.context.commandInstance.sampleId!.should.be.instanceOf(Guid));
    it('should write the parsed identifier', () => form.context.commandInstance.sampleId!.toString().should.equal(sampleGuid));
    it('should not report an error', () => (form.context.customFieldErrors.sampleId === undefined).should.be.true);
    it('should submit once', () => form.http.callCount.should.equal(1));
    it('should serialize the native value', () => form.submittedBody.should.deep.equal({ sampleId: sampleGuid, name: 'Sample User' }));
}));
