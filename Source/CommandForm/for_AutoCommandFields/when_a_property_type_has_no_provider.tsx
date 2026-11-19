// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { an_auto_fields_host } from './given/an_auto_fields_host';

describe('when a property type has no provider', given(an_auto_fields_host, host => {
    beforeEach(async () => host.render('form'));

    it('should omit the property', () => host.labels.should.not.include('Labels'));
}));
