// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyDescriptor } from '@cratis/arc/reflection';
import { clearFieldTypeProviders, registerFieldTypeProvider, resolveFieldTypeProvider } from '../fieldTypeProviderRegistry';
import { InputTextField } from '../fields/InputTextField';
import { TextAreaField } from '../fields/TextAreaField';

describe('when a later provider is registered for an already handled type', () => {
    let result: ReturnType<typeof resolveFieldTypeProvider>;

    beforeEach(() => {
        clearFieldTypeProviders();
        registerFieldTypeProvider({ canHandle: descriptor => descriptor.type === String, component: InputTextField });
        registerFieldTypeProvider({ canHandle: descriptor => descriptor.type === String, component: TextAreaField });

        result = resolveFieldTypeProvider(new PropertyDescriptor('name', String, false));
    });

    it('should prefer the most recently registered provider', () => {
        result!.component.should.equal(TextAreaField);
    });
});
