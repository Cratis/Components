// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../given';
import { a_guid_form } from './given/a_guid_form';

const values = [Guid.empty.toString(), 'ABCDEF01-2345-F678-FFFF-0123456789AB'];

describe('when editing the empty Guid and a Guid with unrestricted version bits', given(a_guid_form, form => {
    const written: (Guid | undefined)[] = [];
    const errors: (string | undefined)[] = [];

    beforeEach(async () => {
        written.length = 0;
        errors.length = 0;
        await form.render();
        for (const value of values) {
            await form.edit(value);
            written.push(form.context.commandInstance.sampleId);
            errors.push(form.context.customFieldErrors.sampleId);
        }
    });

    it('should write native Guids', () => written.every((value) => value instanceof Guid).should.be.true);
    it('should write each identifier', () => written.map(String).should.deep.equal(values.map((value) => value.toLowerCase())));
    it('should not add an implicit nonzero or version rule', () => errors.should.deep.equal([undefined, undefined]));
}));
