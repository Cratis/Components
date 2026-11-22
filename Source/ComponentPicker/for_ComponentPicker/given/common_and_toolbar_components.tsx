// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { type ReactElement } from 'react';
import { Breadcrumbs } from '../../../Common/Breadcrumbs';
import { Message } from '../../../Display/Message';
import { Toolbar } from '../../../Toolbar/Toolbar';
import { ToolbarGroup } from '../../../Toolbar/ToolbarGroup';
import { ToolbarSeparator } from '../../../Toolbar/ToolbarSeparator';
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

export const commonAndToolbarComponents: readonly PresentationComponentCase[] = [
    {
        component: 'Breadcrumbs',
        element: <Breadcrumbs aria-label='Example trail' items={[{ label: <strong>Example Project</strong> }]} separator={<span>›</span>} />,
        defaults: <Breadcrumbs items={[]} />,
        properties: [{ name: 'aria-label', label: 'Accessible label', type: 'string' }],
        current: { 'aria-label': 'Example trail' },
        preview: { 'aria-label': 'Preview trail' },
        read: (element) => element.parentElement!.getAttribute('aria-label'),
        rendered: 'Example trail',
        previewed: 'Preview trail',
        defaultRendered: null,
    },
    {
        component: 'Message',
        element: <Message severity='info' text={<strong>Example status</strong>} />,
        defaults: <Message />,
        properties: [
            { name: 'severity', label: 'Severity', type: 'enum', values: ['info', 'success', 'warn', 'error', 'secondary', 'contrast'], defaultValue: 'info' },
        ],
        current: { severity: 'info' },
        preview: { severity: 'error' },
        read: (element) => [element.dataset.severity, element.getAttribute('role'), element.querySelector('[data-cratis-part="icon"]')!.textContent],
        rendered: ['info', 'status', 'ⓘ'],
        previewed: ['error', 'alert', '⨯'],
        defaultRendered: ['info', 'status', 'ⓘ'],
    },
    {
        component: 'Toolbar',
        element: <Toolbar orientation='horizontal' aria-label='Example tools'><span>Example tool</span></Toolbar>,
        defaults: <Toolbar><span>Example tool</span></Toolbar>,
        properties: [
            { name: 'orientation', label: 'Orientation', type: 'enum', values: ['vertical', 'horizontal'], defaultValue: 'vertical' },
            { name: 'aria-label', label: 'Accessible label', type: 'string' },
        ],
        current: { orientation: 'horizontal', 'aria-label': 'Example tools' },
        preview: { orientation: 'vertical', 'aria-label': 'Preview tools' },
        read: (element) => [element.dataset.orientation, element.getAttribute('aria-orientation'), element.getAttribute('aria-label'), element.classList.contains('cratis:flex-row')],
        rendered: ['horizontal', 'horizontal', 'Example tools', true],
        previewed: ['vertical', 'vertical', 'Preview tools', false],
        defaultRendered: ['vertical', 'vertical', 'Tools', false],
    },
    {
        component: 'ToolbarGroup',
        element: <ToolbarGroup orientation='horizontal'><span>Example tool</span></ToolbarGroup>,
        defaults: <ToolbarGroup />,
        properties: [
            { name: 'orientation', label: 'Orientation', type: 'enum', values: ['vertical', 'horizontal'], defaultValue: 'vertical' },
        ],
        current: { orientation: 'horizontal' },
        preview: { orientation: 'vertical' },
        read: (element) => [element.dataset.orientation, element.classList.contains('cratis:flex-row')],
        rendered: ['horizontal', true],
        previewed: ['vertical', false],
        defaultRendered: ['vertical', false],
    },
    {
        component: 'ToolbarSeparator',
        element: <ToolbarSeparator orientation='horizontal' />,
        defaults: <ToolbarSeparator />,
        properties: [
            { name: 'orientation', label: 'Orientation', type: 'enum', values: ['vertical', 'horizontal'], defaultValue: 'vertical' },
        ],
        current: { orientation: 'horizontal' },
        preview: { orientation: 'vertical' },
        read: (element) => [element.dataset.orientation, element.getAttribute('aria-orientation'), element.classList.contains('toolbar-separator--in-horizontal')],
        rendered: ['horizontal', 'vertical', true],
        previewed: ['vertical', 'horizontal', false],
        defaultRendered: ['vertical', 'horizontal', false],
    },
];
