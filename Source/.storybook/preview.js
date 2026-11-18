// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { addons } from 'storybook/preview-api';
import React from 'react';
import './foundation.css';
import './preview.css';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import {
    DEFAULT_DESIGNSYSTEMET_SIZE,
    DESIGNSYSTEMET_MODES,
    DESIGNSYSTEMET_SIZES,
    applyDesignsystemetMode,
    isDesignsystemetMode,
} from './designsystemet';

const DARK_SELECTOR = 'cratis-dark';
const LIGHT_SELECTOR = 'cratis-light';

const APPEARANCE_MODES = {
    'baseline-dark': {
        title: 'Cratis baseline — dark',
        dark: true,
        bodyClass: null,
    },
    'baseline-light': {
        title: 'Cratis baseline — light',
        dark: false,
        bodyClass: null,
    },
    'product-theme': {
        title: 'Product-owned token mapping',
        dark: true,
        bodyClass: 'storybook-product-theme',
    },
    // Designsystemet modes drive data-color-scheme / data-size instead of the Cratis classes; the
    // dark flag only keeps the baseline classes consistent until applyDesignsystemetMode takes over.
    ...Object.fromEntries(
        Object.entries(DESIGNSYSTEMET_MODES).map(([key, mode]) => [
            key,
            { title: mode.title, dark: mode.scheme === 'dark', bodyClass: null },
        ]),
    ),
};

const ALL_BODY_CLASSES = Object.values(APPEARANCE_MODES)
    .map((mode) => mode.bodyClass)
    .filter(Boolean);

let docsSiteAppearance = null;

addons.getChannel().on('STORYBOOK_THEME_CHANGE', ({ theme }) => {
    docsSiteAppearance = theme === 'light' ? 'baseline-light' : 'baseline-dark';
    const mode = APPEARANCE_MODES[docsSiteAppearance];
    if (mode) applyAppearance(mode, docsSiteAppearance);
});

export const tags = ['autodocs'];

export const globalTypes = {
    appearance: {
        name: 'Appearance',
        description: 'Render with the Cratis baseline or a product-owned token mapping',
        defaultValue: 'baseline-dark',
        toolbar: {
            icon: 'paintbrush',
            items: Object.entries(APPEARANCE_MODES).map(([value, mode]) => ({
                value,
                title: mode.title,
            })),
            showName: true,
        },
    },
    designsystemetSize: {
        name: 'Designsystemet size',
        description: 'Designsystemet size mode (only used by the Designsystemet appearances)',
        defaultValue: DEFAULT_DESIGNSYSTEMET_SIZE,
        toolbar: {
            icon: 'ruler',
            items: DESIGNSYSTEMET_SIZES,
            showName: true,
        },
    },
};

function applyAppearance(mode, appearanceKey, designsystemetSize) {
    document.documentElement.classList.toggle(DARK_SELECTOR, mode.dark);
    document.documentElement.classList.toggle(LIGHT_SELECTOR, !mode.dark);
    document.body.classList.remove(...ALL_BODY_CLASSES);
    if (mode.bodyClass) document.body.classList.add(mode.bodyClass);
    applyDesignsystemetMode(
        document.documentElement,
        isDesignsystemetMode(appearanceKey) ? appearanceKey : null,
        designsystemetSize,
    );
}

export const decorators = [
    (Story, context) => {
        const appearanceKey =
            docsSiteAppearance ?? context.globals.appearance ?? 'baseline-dark';
        const mode = APPEARANCE_MODES[appearanceKey] ?? APPEARANCE_MODES['baseline-dark'];
        applyAppearance(mode, appearanceKey, context.globals.designsystemetSize);

        return React.createElement(
            CratisComponentsProvider,
            { key: appearanceKey, value: { locale: 'en-US' } },
            React.createElement(Story),
        );
    },
];

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    a11y: { test: 'error' },
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
