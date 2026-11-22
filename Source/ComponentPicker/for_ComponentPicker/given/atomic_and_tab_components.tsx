// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type ReactElement } from 'react';
import { NumericInput } from '../../../Common/NumericInput';
import { NumberInput } from '../../../Common/NumberInput';
import { ToggleGroup } from '../../../Common/ToggleGroup';
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
        component: 'NumberInput',
        element: <NumberInput value={12} onChange={() => undefined} placeholder='Example number' aria-label='Example quantity' showSteppers />,
        defaults: <NumberInput value={null} onChange={() => undefined} />,
        properties: [
            { name: 'placeholder', label: 'Placeholder', type: 'string' },
            { name: 'aria-label', label: 'Accessible label', type: 'string' },
            { name: 'showSteppers', label: 'Show steppers', type: 'boolean', defaultValue: true },
        ],
        current: { placeholder: 'Example number', 'aria-label': 'Example quantity', showSteppers: true },
        preview: { placeholder: 'Preview number', 'aria-label': 'Preview quantity', showSteppers: false },
        read: (element) => [element.querySelector('input')!.getAttribute('placeholder'), element.querySelector('input')!.getAttribute('aria-label'), element.querySelectorAll('button').length],
        rendered: ['Example number', 'Example quantity', 2],
        previewed: ['Preview number', 'Preview quantity', 0],
        defaultRendered: [null, null, 2],
    },
    {
        component: 'ToggleGroup',
        element: <ToggleGroup options={[{ value: 'example', label: 'Example option' }]} value='example' onChange={() => undefined} aria-label='Example choices' invalid={false} />,
        defaults: <ToggleGroup options={[]} value='' onChange={() => undefined} />,
        properties: [
            { name: 'aria-label', label: 'Accessible label', type: 'string' },
            { name: 'invalid', label: 'Invalid', type: 'boolean', defaultValue: false },
        ],
        current: { 'aria-label': 'Example choices', invalid: false },
        preview: { 'aria-label': 'Preview choices', invalid: true },
        read: (element) => [element.getAttribute('aria-label'), element.getAttribute('data-invalid')],
        rendered: ['Example choices', null],
        previewed: ['Preview choices', 'true'],
        defaultRendered: [null, null],
    },
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
