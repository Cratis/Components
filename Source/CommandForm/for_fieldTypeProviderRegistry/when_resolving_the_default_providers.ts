// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyDescriptor } from '@cratis/arc/reflection';
import { clearFieldTypeProviders, resolveFieldTypeProvider } from '../fieldTypeProviderRegistry';
import { registerDefaultFieldTypeProviders } from '../defaultFieldTypeProviders';
import { InputTextField } from '../fields/InputTextField';
import { NumberField } from '../fields/NumberField';
import { CheckboxField } from '../fields/CheckboxField';
import { CalendarField } from '../fields/CalendarField';

describe('when resolving the default providers', () => {
    beforeEach(() => {
        clearFieldTypeProviders();
        registerDefaultFieldTypeProviders();
    });

    it('should resolve a string property to InputTextField', () => {
        resolveFieldTypeProvider(new PropertyDescriptor('name', String, false))!.component.should.equal(InputTextField);
    });

    it('should resolve a number property to NumberField', () => {
        resolveFieldTypeProvider(new PropertyDescriptor('age', Number, false))!.component.should.equal(NumberField);
    });

    it('should resolve a boolean property to CheckboxField', () => {
        resolveFieldTypeProvider(new PropertyDescriptor('active', Boolean, false))!.component.should.equal(CheckboxField);
    });

    it('should resolve a Date property to CalendarField', () => {
        resolveFieldTypeProvider(new PropertyDescriptor('startedAt', Date, false))!.component.should.equal(CalendarField);
    });
});
