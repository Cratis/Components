// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type ReactElement } from 'react';
import { Avatar } from '../../../Display/Avatar';
import { Badge } from '../../../Display/Badge';
import { Chip } from '../../../Display/Chip';
import { ProgressSpinner } from '../../../Display/ProgressSpinner';
import { Skeleton } from '../../../Display/Skeleton';
import { Tag } from '../../../Display/Tag';
import type { PresentationPropertyDescriptor } from '../../../configuration/identity/PresentationPropertyDescriptor';
import type { PresentationPropertyValue } from '../../../configuration/identity/PresentationPropertyValue';

interface DisplayComponentCase {
    component: string;
    element: ReactElement;
    properties: readonly PresentationPropertyDescriptor<Record<string, unknown>>[];
    current: Record<string, PresentationPropertyValue>;
    preview: Record<string, PresentationPropertyValue>;
    read: (element: HTMLElement) => unknown;
    rendered: unknown;
    previewed: unknown;
}

export const displayComponents: readonly DisplayComponentCase[] = [
    {
        component: 'Badge',
        element: <Badge value={7} severity='info' size='large' shape='circle' />,
        properties: [
            { name: 'severity', label: 'Severity', type: 'enum', values: ['secondary', 'info', 'success', 'warn', 'danger', 'contrast'], defaultValue: 'secondary' },
            { name: 'size', label: 'Size', type: 'enum', values: ['small', 'large', 'xlarge'], defaultValue: 'small' },
            { name: 'shape', label: 'Shape', type: 'enum', values: ['circle'] },
        ],
        current: { severity: 'info', size: 'large', shape: 'circle' },
        preview: { severity: 'success', size: 'xlarge', shape: undefined },
        read: (element) => [element.dataset.severity, element.dataset.size, element.dataset.shape, element.textContent],
        rendered: ['info', 'large', 'circle', '7'],
        previewed: ['success', 'xlarge', undefined, '7'],
    },
    {
        component: 'Chip',
        element: <Chip label='Example Project' removable removeAriaLabel='Remove example' onRemove={() => undefined} />,
        properties: [
            { name: 'label', label: 'Label', type: 'string' },
            { name: 'removeAriaLabel', label: 'Remove accessible name', type: 'string', defaultValue: 'Remove' },
        ],
        current: { label: 'Example Project', removeAriaLabel: 'Remove example' },
        preview: { label: 'Demo Assistant', removeAriaLabel: 'Remove preview' },
        read: (element) => [element.querySelector('[data-cratis-part="label"]')?.textContent, element.querySelector('button')?.getAttribute('aria-label')],
        rendered: ['Example Project', 'Remove example'],
        previewed: ['Demo Assistant', 'Remove preview'],
    },
    {
        component: 'Avatar',
        element: <Avatar label='SU' alt='Sample User' size='large' />,
        properties: [
            { name: 'label', label: 'Label', type: 'string' },
            { name: 'alt', label: 'Alternative text', type: 'string', defaultValue: '' },
            { name: 'size', label: 'Size', type: 'enum', values: ['normal', 'large', 'xlarge'], defaultValue: 'normal' },
        ],
        current: { label: 'SU', alt: 'Sample User', size: 'large' },
        preview: { label: 'DA', size: 'xlarge' },
        read: (element) => [element.textContent, element.dataset.size],
        rendered: ['SU', 'large'],
        previewed: ['DA', 'xlarge'],
    },
    {
        component: 'Tag',
        element: <Tag value='Example status' severity='info' rounded={false} />,
        properties: [
            { name: 'severity', label: 'Severity', type: 'enum', values: ['secondary', 'success', 'info', 'warn', 'danger', 'contrast'], defaultValue: 'secondary' },
            { name: 'rounded', label: 'Rounded', type: 'boolean' },
        ],
        current: { severity: 'info', rounded: false },
        preview: { severity: 'success', rounded: true },
        read: (element) => [element.dataset.severity, element.dataset.rounded, element.textContent],
        rendered: ['info', undefined, 'Example status'],
        previewed: ['success', 'true', 'Example status'],
    },
    {
        component: 'Skeleton',
        element: <Skeleton width='4rem' height='2rem' borderRadius='1px' circle={false} />,
        properties: [
            { name: 'width', label: 'Width', type: 'string', defaultValue: '100%' },
            { name: 'height', label: 'Height', type: 'string', defaultValue: '1rem' },
            { name: 'borderRadius', label: 'Border radius', type: 'string' },
            { name: 'circle', label: 'Circle', type: 'boolean' },
        ],
        current: { width: '4rem', height: '2rem', borderRadius: '1px', circle: false },
        preview: { width: '6rem', height: '3rem', borderRadius: '2px' },
        read: (element) => [element.style.width, element.style.height, element.style.borderRadius, element.dataset.circle],
        rendered: ['4rem', '2rem', '1px', undefined],
        previewed: ['6rem', '3rem', '2px', undefined],
    },
    {
        component: 'ProgressSpinner',
        element: <ProgressSpinner aria-label='Loading example' />,
        properties: [
            { name: 'aria-label', label: 'Accessible name', type: 'string', defaultValue: 'Loading' },
        ],
        current: { 'aria-label': 'Loading example' },
        preview: { 'aria-label': 'Loading preview' },
        read: (element) => element.getAttribute('aria-label'),
        rendered: 'Loading example',
        previewed: 'Loading preview',
    },
];
