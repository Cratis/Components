// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import 'primeicons/primeicons.css';
import './preview.css';
import darkThemeUrl from 'primereact/resources/themes/lara-dark-blue/theme.css?url';
import lightThemeUrl from 'primereact/resources/themes/lara-light-blue/theme.css?url';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import { tailwindPtPreset } from './pt-preset';

const STYLING_MODES = {
    'lara-dark': {
        title: 'Path A — Lara Dark Blue',
        themeUrl: darkThemeUrl,
        bodyClass: null,
        providerValue: {},
    },
    'lara-light': {
        title: 'Path A — Lara Light Blue',
        themeUrl: lightThemeUrl,
        bodyClass: null,
        providerValue: {},
    },
    'cratis-themed': {
        title: 'Path B — Themed with custom palette',
        themeUrl: darkThemeUrl,
        bodyClass: 'cratis-themed',
        providerValue: {},
    },
    'unstyled-bare': {
        title: 'Path C — Unstyled (bare structure)',
        themeUrl: null,
        bodyClass: 'cratis-unstyled-bare',
        providerValue: { unstyled: true },
    },
    'unstyled-pt': {
        title: 'Path C — Unstyled + Tailwind pt',
        themeUrl: null,
        bodyClass: 'cratis-unstyled-pt',
        providerValue: { unstyled: true, pt: tailwindPtPreset },
    },
};

const ALL_BODY_CLASSES = Object.values(STYLING_MODES)
    .map(mode => mode.bodyClass)
    .filter(Boolean);

// Tracks the theme pushed from the embedding docs site via postMessage.
// null means "not embedded — use the toolbar selection".
let _docsSiteTheme = null;

window.addEventListener('message', (event) => {
    if (event.data?.type !== 'STORYBOOK_THEME_CHANGE') return;
    _docsSiteTheme = event.data.theme === 'light' ? 'lara-light' : 'lara-dark';
    const mode = STYLING_MODES[_docsSiteTheme];
    if (mode) {
        applyThemeLink(mode.themeUrl);
        applyBodyClass(mode.bodyClass);
    }
});

export const globalTypes = {
    theme: {
        name: 'Styling',
        description: 'Which README styling path to render the story under',
        defaultValue: 'lara-dark',
        toolbar: {
            icon: 'paintbrush',
            items: Object.entries(STYLING_MODES).map(([value, mode]) => ({
                value,
                title: mode.title,
            })),
            showName: true,
        },
    },
};

function applyThemeLink(href) {
    let link = document.getElementById('primereact-theme');
    if (href === null) {
        if (link) {
            link.remove();
        }
        return;
    }
    if (!link) {
        link = document.createElement('link');
        link.id = 'primereact-theme';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    // Changed: use getAttribute instead of .href property to avoid triggering HMR
    const currentHref = link.getAttribute('href');
    if (currentHref !== href) {
        link.setAttribute('href', href);
    }
}

function applyBodyClass(className) {
    document.body.classList.remove(...ALL_BODY_CLASSES);
    if (className) {
        document.body.classList.add(className);
    }
}

export const decorators = [
    (Story, context) => {
        const themeKey = _docsSiteTheme ?? context.globals.theme ?? 'lara-dark';
        const mode = STYLING_MODES[themeKey] ?? STYLING_MODES['lara-dark'];

        applyThemeLink(mode.themeUrl);
        applyBodyClass(mode.bodyClass);

        return React.createElement(
            CratisComponentsProvider,
            { value: mode.providerValue },
            React.createElement(Story)
        );
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


