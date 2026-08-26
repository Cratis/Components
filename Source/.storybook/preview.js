// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { addons } from 'storybook/preview-api';
import React from 'react';
import 'primeicons/primeicons.css';
import '../tokens.css';
import '../styles.css';
import './preview.css';
import '../theme.css';
import '../primereact-v10-palette.css';
import Aura from '@primeuix/themes/aura';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import { styledMode } from '../Styled';
import { tailwindPtPreset } from './pt-preset';

// PrimeReact 11 is unstyled-first and token-based: the styled look is styled mode -
// PrimeReact's own component styles handed to every primitive through the provider's
// `defaults`, painted by a @primeuix/themes preset applied through its `theme` config
// (which injects the `--p-*` design tokens). A preset alone styles nothing; that is what
// `styledMode()` composes. Dark mode is toggled with the class the preset's
// `darkModeSelector` targets. There are no theme CSS files to <link> anymore (the v10
// `primereact/resources/themes/lara-*` files were removed).
const DARK_SELECTOR = 'cratis-dark';

// PrimeReact 11 verifies a PrimeUI license key when its provider mounts, whatever the
// styling path — unstyled and the Cratis baseline theme are not exempt (see §"Licensing"
// in MIGRATION.md). Set PRIMEUI_LICENSE in your shell to your own key; main.ts relays it
// into import.meta.env (Storybook's Vite builder only forwards STORYBOOK_-prefixed vars
// by default, so a plain PRIMEUI_LICENSE needs that explicit relay). The default mode
// below is the unstyled + Tailwind `pt` path.
const PRIMEUI_LICENSE = import.meta.env?.PRIMEUI_LICENSE ?? import.meta.env?.STORYBOOK_PRIMEUI_LICENSE;
const withLicense = (value) => (PRIMEUI_LICENSE ? { ...value, license: PRIMEUI_LICENSE } : value);

const STYLING_MODES = {
    'unstyled-pt': {
        title: 'Path C — Unstyled + Tailwind pt (default)',
        dark: true,
        bodyClass: 'cratis-unstyled-pt',
        providerValue: withLicense({ unstyled: true, pt: tailwindPtPreset }),
    },
    'unstyled-bare': {
        title: 'Path C — Unstyled (bare structure)',
        dark: true,
        bodyClass: 'cratis-unstyled-bare',
        providerValue: withLicense({ unstyled: true }),
    },
    'styled-dark': {
        title: 'Path A — Styled mode, Cratis preset, dark',
        dark: true,
        bodyClass: null,
        providerValue: withLicense({ ripple: true, ...styledMode() }),
    },
    'styled-light': {
        title: 'Path A — Styled mode, Cratis preset, light',
        dark: false,
        bodyClass: null,
        providerValue: withLicense({ ripple: true, ...styledMode() }),
    },
    'styled-aura-dark': {
        title: 'Path A — Styled mode, Aura preset, dark',
        dark: true,
        bodyClass: null,
        providerValue: withLicense({ ripple: true, ...styledMode({ preset: Aura }) }),
    },
    'cratis-theme': {
        title: 'Path B — Cratis baseline theme, dark',
        dark: true,
        bodyClass: 'cratis-theme',
        providerValue: withLicense({ unstyled: true }),
    },
    'cratis-theme-light': {
        title: 'Path B — Cratis baseline theme, light',
        dark: false,
        bodyClass: 'cratis-theme',
        providerValue: withLicense({ unstyled: true }),
    },
};

const ALL_BODY_CLASSES = Object.values(STYLING_MODES)
    .map(mode => mode.bodyClass)
    .filter(Boolean);

// Tracks the theme relayed from manager.js via the Storybook channel.
// null means "not embedded — use the toolbar selection".
let _docsSiteTheme = null;

addons.getChannel().on('STORYBOOK_THEME_CHANGE', ({ theme }) => {
    _docsSiteTheme = theme === 'light' ? 'styled-light' : 'styled-dark';
    const mode = STYLING_MODES[_docsSiteTheme];
    if (mode) {
        applyDarkMode(mode.dark);
        applyBodyClass(mode.bodyClass);
    }
});

export const globalTypes = {
    theme: {
        name: 'Styling',
        description: 'Which README styling path to render the story under',
        defaultValue: 'unstyled-pt',
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

function applyDarkMode(isDark) {
    document.documentElement.classList.toggle(DARK_SELECTOR, !!isDark);
}

function applyBodyClass(className) {
    document.body.classList.remove(...ALL_BODY_CLASSES);
    if (className) {
        document.body.classList.add(className);
    }
}

export const decorators = [
    (Story, context) => {
        const themeKey = _docsSiteTheme ?? context.globals.theme ?? 'unstyled-pt';
        const mode = STYLING_MODES[themeKey] ?? STYLING_MODES['unstyled-pt'];

        applyDarkMode(mode.dark);
        applyBodyClass(mode.bodyClass);

        // Key the provider by the selected mode so switching styling paths fully
        // remounts it — this re-initializes the injected `@primeuix/themes` stylesheet
        // instead of leaving a stale preset behind when moving to/from unstyled modes.
        return React.createElement(
            CratisComponentsProvider,
            { key: themeKey, value: mode.providerValue },
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
