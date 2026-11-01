// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { describeComponent } from '../configuration/identity/describeComponent';
import type { PresentationPropertyDescriptor } from '../configuration/identity/PresentationPropertyDescriptor';
import type { ButtonProps } from './Button';
import type { IconButtonProps } from './IconButton';

const buttonProperties: readonly PresentationPropertyDescriptor<ButtonProps>[] = [
    { name: 'label', label: 'Label', type: 'string', description: 'The text on the button.' },
    { name: 'tooltip', label: 'Tooltip', type: 'string', description: 'Text shown on hover and focus.' },
    {
        name: 'variant',
        label: 'Variant',
        type: 'enum',
        values: ['solid', 'outline', 'ghost', 'link'],
        defaultValue: 'solid',
    },
    {
        name: 'tone',
        label: 'Tone',
        type: 'enum',
        values: ['neutral', 'accent', 'positive', 'caution', 'critical'],
    },
    { name: 'shape', label: 'Shape', type: 'enum', values: ['default', 'pill'], defaultValue: 'default' },
    { name: 'size', label: 'Size', type: 'enum', values: ['small', 'normal', 'large'], defaultValue: 'normal' },
];

/** Presentation props of {@link Button}. */
export const buttonDescriptor = describeComponent<ButtonProps>('Button', buttonProperties);

/** Presentation props of {@link IconButton}. */
export const iconButtonDescriptor = describeComponent<IconButtonProps>('IconButton', [
    ...(buttonProperties.filter(
        (property) => property.name !== 'label',
    ) as unknown as PresentationPropertyDescriptor<IconButtonProps>[]),
]);
