// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { an_auto_fields_host } from './given/an_auto_fields_host';

describe('when validation fails', given(an_auto_fields_host, host => {
    beforeEach(async () => {
        await host.render('form', { registerGuid: true });
        await host.edit('Sample Id', 'partial');
        await host.submit('form');
    });

    it('should not execute the command', () => host.submitted.length.should.equal(0));
}));
