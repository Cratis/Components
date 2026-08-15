// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyDescriptor } from '@cratis/arc/reflection';
import { clearFieldTypeProviders, resolveFieldTypeProvider } from '../fieldTypeProviderRegistry';

describe('when resolving a provider for an unregistered type', () => {
    let result: ReturnType<typeof resolveFieldTypeProvider>;

    beforeEach(() => {
        clearFieldTypeProviders();
        result = resolveFieldTypeProvider(new PropertyDescriptor('id', Object, false));
    });

    it('should return undefined', () => {
        (result === undefined).should.be.true;
    });
});
