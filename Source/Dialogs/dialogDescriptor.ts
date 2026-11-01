// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describeComponent } from '../configuration/identity/describeComponent';
import type { DialogProps } from './Dialog';

/** Presentation props of {@link Dialog}. */
export const dialogDescriptor = describeComponent<DialogProps>('Dialog', [
    { name: 'title', label: 'Title', type: 'string', description: 'The dialog heading.' },
    { name: 'placement', label: 'Placement', type: 'enum', values: ['center', 'start', 'end'], defaultValue: 'center' },
    { name: 'width', label: 'Width', type: 'string', defaultValue: '450px' },
    { name: 'okLabel', label: 'Ok label', type: 'string' },
    { name: 'cancelLabel', label: 'Cancel label', type: 'string' },
]);
