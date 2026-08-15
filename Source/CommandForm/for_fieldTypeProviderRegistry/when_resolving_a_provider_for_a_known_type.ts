// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyDescriptor } from '@cratis/arc/reflection';
import { clearFieldTypeProviders, registerFieldTypeProvider, resolveFieldTypeProvider } from '../fieldTypeProviderRegistry';
import { InputTextField } from '../fields/InputTextField';

describe('when resolving a provider for a known type', () => {
    let result: ReturnType<typeof resolveFieldTypeProvider>;

    beforeEach(() => {
        clearFieldTypeProviders();
        registerFieldTypeProvider({ canHandle: descriptor => descriptor.type === String, component: InputTextField });

        result = resolveFieldTypeProvider(new PropertyDescriptor('name', String, false));
    });

    it('should return the registered provider', () => {
        result!.component.should.equal(InputTextField);
    });
});
