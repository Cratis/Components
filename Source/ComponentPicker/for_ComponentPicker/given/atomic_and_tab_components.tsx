// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type ReactElement } from 'react';
import { NumericInput } from '../../../Common/NumericInput';
import { Surface } from '../../../Common/Surface';
import { Tabs } from '../../../Common/Tabs';
import { ProgressBar } from '../../../Display/ProgressBar';
import type { PresentationPropertyDescriptor } from '../../../configuration/identity/PresentationPropertyDescriptor';
import type { PresentationPropertyValue } from '../../../configuration/identity/PresentationPropertyValue';

interface PresentationComponentCase {
    component: string;
    element: ReactElement;
    defaults: ReactElement;
    properties: readonly PresentationPropertyDescriptor<Record<string, unknown>>[];
    current: Record<string, PresentationPropertyValue>;
    preview: Record<string, PresentationPropertyValue>;
    read: (element: HTMLElement) => unknown;
    rendered: unknown;
    previewed: unknown;
    defaultRendered: unknown;
}

export const atomicAndTabComponents: readonly PresentationComponentCase[] = [
    {
        component: 'ProgressBar',
        element: <ProgressBar value={40} showValue={true} aria-label='Example progress' />,
        defaults: <ProgressBar />,
        properties: [
            { name: 'showValue', label: 'Show value', type: 'boolean', defaultValue: true },
            { name: 'aria-label', label: 'Accessible label', type: 'string', defaultValue: 'Progress' },
        ],
        current: { showValue: true, 'aria-label': 'Example progress' },
        preview: { showValue: false, 'aria-label': 'Preview progress' },
        read: (element) => [element.getAttribute('aria-label'), element.querySelector('[data-cratis-part="label"]')?.textContent],
        rendered: ['Example progress', '40%'],
        previewed: ['Preview progress', undefined],
        defaultRendered: ['Progress', '0%'],
    },
    {
        component: 'Surface',
        element: <Surface as='section' aria-label='Example surface'><strong>Example content</strong></Surface>,
        defaults: <Surface />,
        properties: [{ name: 'aria-label', label: 'Accessible label', type: 'string' }],
        current: { 'aria-label': 'Example surface' },
        preview: { 'aria-label': 'Preview surface' },
        read: (element) => element.getAttribute('aria-label'),
        rendered: 'Example surface',
        previewed: 'Preview surface',
        defaultRendered: null,
    },
    {
        component: 'NumericInput',
        element: <NumericInput value={12} placeholder='Example number' aria-label='Example quantity' />,
        defaults: <NumericInput />,
        properties: [
            { name: 'placeholder', label: 'Placeholder', type: 'string' },
            { name: 'aria-label', label: 'Accessible label', type: 'string' },
        ],
        current: { placeholder: 'Example number', 'aria-label': 'Example quantity' },
        preview: { placeholder: 'Preview number', 'aria-label': 'Preview quantity' },
        read: (element) => [element.getAttribute('placeholder'), element.getAttribute('aria-label')],
        rendered: ['Example number', 'Example quantity'],
        previewed: ['Preview number', 'Preview quantity'],
        defaultRendered: [null, null],
    },
    {
        component: 'Tabs',
        element: <Tabs aria-label='Example tabs' tabs={[{ id: 'example', label: 'Example tab', content: 'Example panel' }]} value='example' onChange={() => undefined} />,
        defaults: <Tabs aria-labelledby='example-heading' tabs={[]} value='' onChange={() => undefined} />,
        properties: [{ name: 'aria-label', label: 'Accessible label', type: 'string' }],
        current: { 'aria-label': 'Example tabs' },
        preview: { 'aria-label': 'Preview tabs' },
        read: (element) => element.querySelector('[role="tablist"]')!.getAttribute('aria-label'),
        rendered: 'Example tabs',
        previewed: 'Preview tabs',
        defaultRendered: null,
    },
];
