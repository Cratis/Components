// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyDescriptor } from '@cratis/arc/reflection';
import { registerDefaultFieldTypeProviders } from '../defaultFieldTypeProviders';
import {
    clearFieldTypeProviders,
    registerFieldTypeProvider,
    resolveFieldTypeProvider,
} from '../fieldTypeProviderRegistry';
import { TextAreaField } from '../fields/TextAreaField';

describe('when overriding a default provider', () => {
    beforeEach(() => {
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
        registerFieldTypeProvider({
            canHandle: (descriptor) => descriptor.type === String,
            component: TextAreaField,
        });
    });

    it('should prefer the consumer provider', () => {
        resolveFieldTypeProvider(
            new PropertyDescriptor('name', String, false),
        )!.component.should.equal(TextAreaField);
    });
});
