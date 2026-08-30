// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { registerFieldTypeProvider } from './fieldTypeProviderRegistry';
import { InputTextField } from './fields/InputTextField';
import { NumberField } from './fields/NumberField';
import { CheckboxField } from './fields/CheckboxField';
import { CalendarField } from './fields/CalendarField';

/**
 * Registers the built-in {@link FieldTypeProvider}s {@link AutoCommandForm} falls back to for the
 * JavaScript primitive types a command property can have. {@link AutoCommandForm} calls this
 * explicitly when its module loads so production tree shaking cannot discard the registration.
 */
export function registerDefaultFieldTypeProviders(): void {
    registerFieldTypeProvider({
        canHandle: (descriptor) => descriptor.type === String,
        component: InputTextField,
    });
    registerFieldTypeProvider({
        canHandle: (descriptor) => descriptor.type === Number,
        component: NumberField,
    });
    registerFieldTypeProvider({
        canHandle: (descriptor) => descriptor.type === Boolean,
        component: CheckboxField,
    });
    registerFieldTypeProvider({
        canHandle: (descriptor) => descriptor.type === Date,
        component: CalendarField,
    });
}
