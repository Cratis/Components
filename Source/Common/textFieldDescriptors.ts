// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describeComponent } from '../configuration/identity/describeComponent';
import type { TextAreaProps } from './TextArea';
import type { TextInputProps } from './TextInput';

/** Presentation props of {@link TextInput}. */
export const textInputDescriptor = describeComponent<TextInputProps>('TextInput', [
    { name: 'placeholder', label: 'Placeholder', type: 'string', description: 'Hint shown while the field is empty.' },
    { name: 'invalid', label: 'Invalid', type: 'boolean', defaultValue: false },
    { name: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    { name: 'readOnly', label: 'Read only', type: 'boolean', defaultValue: false },
    {
        name: 'type',
        label: 'Input type',
        type: 'enum',
        values: ['text', 'email', 'password', 'search', 'tel', 'url'],
        defaultValue: 'text',
    },
]);

/** Presentation props of {@link TextArea}. */
export const textAreaDescriptor = describeComponent<TextAreaProps>('TextArea', [
    { name: 'placeholder', label: 'Placeholder', type: 'string', description: 'Hint shown while the field is empty.' },
    { name: 'rows', label: 'Rows', type: 'number' },
    { name: 'invalid', label: 'Invalid', type: 'boolean', defaultValue: false },
    { name: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    { name: 'readOnly', label: 'Read only', type: 'boolean', defaultValue: false },
]);
