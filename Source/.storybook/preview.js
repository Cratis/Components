// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import 'primeicons/primeicons.css';
import './preview.css';
import darkThemeUrl from 'primereact/resources/themes/lara-dark-blue/theme.css?url';
import lightThemeUrl from 'primereact/resources/themes/lara-light-blue/theme.css?url';

export const globalTypes = {
    theme: {
        name: 'Theme',
        description: 'PrimeReact theme',
        defaultValue: 'dark',
        toolbar: {
            icon: 'paintbrush',
            items: [
                { value: 'dark', title: 'Lara Dark Blue' },
                { value: 'light', title: 'Lara Light Blue' },
            ],
            showName: true,
        },
    },
};

function applyThemeLink(href) {
    let link = document.getElementById('primereact-theme');
    if (!link) {
        link = document.createElement('link');
        link.id = 'primereact-theme';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
}

export const decorators = [
    (Story, context) => {
        applyThemeLink(context.globals.theme === 'light' ? lightThemeUrl : darkThemeUrl);
        return React.createElement(Story);
    },
];

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    backgrounds: {
        default: 'dark',
        values: [
            { name: 'dark', value: '#111827' },
            { name: 'surface-card', value: '#1f2937' },
            { name: 'light', value: '#ffffff' },
            { name: 'surface-light', value: '#f8f9fa' },
        ],
    },
};
