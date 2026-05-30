// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import 'primeicons/primeicons.css';
import './preview.css';
import darkThemeUrl from 'primereact/resources/themes/lara-dark-blue/theme.css?url';
import lightThemeUrl from 'primereact/resources/themes/lara-light-blue/theme.css?url';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import { tailwindPtPreset } from './pt-preset';

/**
 * Each toolbar entry maps to one of the three documented styling paths in
 * Source/README.md. Stories don't need to change — every mode renders the
 * same component tree under a different provider/theme/token combination.
 */
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
        // Path B = a PrimeReact theme provides the structural chrome, then the
        // body class overrides PrimeReact's own --surface-* / --text-color /
        // --primary-color variables (and the --cratis-* siblings) to retint
        // every widget with a Cratis-flavored slate + sky palette.
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
        if (link) link.remove();
        return;
    }
    if (!link) {
        link = document.createElement('link');
        link.id = 'primereact-theme';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
}

function applyBodyClass(className) {
    document.body.classList.remove(...ALL_BODY_CLASSES);
    if (className) document.body.classList.add(className);
}

export const decorators = [
    (Story, context) => {
        const mode = STYLING_MODES[context.globals.theme] ?? STYLING_MODES['lara-dark'];

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
