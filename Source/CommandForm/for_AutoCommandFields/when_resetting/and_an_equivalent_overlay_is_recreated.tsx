// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { Guid } from '@cratis/fundamentals';
import type {} from 'chai/register-should';
import { given } from '../../../given';
import { an_auto_fields_host } from '.././given/an_auto_fields_host';
const sampleGuid = '852afc19-b630-43ba-a612-93e1c522078d';

describe('when resetting a draft and an equivalent overlay is recreated', given(an_auto_fields_host, host => {
    beforeEach(async () => {
        await host.render('form', { registerGuid: true, hostCurrentValues: { sampleId: Guid.parse(sampleGuid) }, fields: { currentValues: { sampleId: Guid.parse(sampleGuid) } } });
        await host.edit('Sample Id', 'partial');
        await host.rerender('form', { hostCurrentValues: { sampleId: Guid.parse(sampleGuid) }, fields: { currentValues: { sampleId: Guid.parse(sampleGuid) } } });
    });

    it('should keep the draft', () => host.input('Sample Id').value.should.equal('partial'));
}));
