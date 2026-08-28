// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { addons } from 'storybook/preview-api';
import React from 'react';
import { RendererPreviewProvider } from 'virtual:cratis-renderer-preview';
import '../../Source/.storybook/foundation.css';
import '../../Source/.storybook/preview.css';

const darkSelector = 'cratis-dark';
const lightSelector = 'cratis-light';

const appearanceModes = {
    'baseline-dark': {
        title: 'Cratis baseline — dark',
        dark: true,
        bodyClass: undefined,
    },
    'baseline-light': {
        title: 'Cratis baseline — light',
        dark: false,
        bodyClass: undefined,
    },
    'product-theme': {
        title: 'Product-owned token mapping',
        dark: true,
        bodyClass: 'storybook-product-theme',
    },
} as const;

type Appearance = keyof typeof appearanceModes;
const allBodyClasses: string[] = Object.values(appearanceModes).flatMap(mode =>
    mode.bodyClass ? [mode.bodyClass] : [],
);
let docsSiteAppearance: Appearance | undefined;

const applyAppearance = (appearance: Appearance) => {
    const mode = appearanceModes[appearance];
    document.documentElement.classList.toggle(darkSelector, mode.dark);
    document.documentElement.classList.toggle(lightSelector, !mode.dark);
    document.body.classList.remove(...allBodyClasses);
    if (mode.bodyClass) document.body.classList.add(mode.bodyClass);
};

addons.getChannel().on('STORYBOOK_THEME_CHANGE', ({ theme }: { readonly theme: string }) => {
    docsSiteAppearance = theme === 'light' ? 'baseline-light' : 'baseline-dark';
    applyAppearance(docsSiteAppearance);
});

export const tags = ['autodocs'];

export const globalTypes = {
    appearance: {
        name: 'Appearance',
        description: 'Render with the Cratis baseline or a product-owned token mapping',
        defaultValue: 'baseline-dark',
        toolbar: {
            icon: 'paintbrush',
            items: Object.entries(appearanceModes).map(([value, mode]) => ({
                value,
                title: mode.title,
            })),
            showName: true,
        },
    },
};

export const decorators = [
    (Story: React.ComponentType, context: { readonly globals: { readonly appearance?: Appearance } }) => {
        const appearance = docsSiteAppearance ?? context.globals.appearance ?? 'baseline-dark';
        applyAppearance(appearance);
        return (
            <RendererPreviewProvider appearance={appearance}>
                <Story />
            </RendererPreviewProvider>
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
