// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import type {} from 'chai/register-should';
import { given } from '../../given';
import { an_auto_fields_host } from './given/an_auto_fields_host';
import { registerFieldTypeProvider } from '../fieldTypeProviderRegistry';
import { InputTextField } from '../fields';

describe('when a provider override is registered', given(an_auto_fields_host, host => {
    beforeEach(async () => {
        registerFieldTypeProvider({ canHandle: (descriptor) => descriptor.type === Map, component: InputTextField });
        await host.render('form');
    });

    it('should render the overridden property', () => host.labels.should.include('Labels'));
}));
