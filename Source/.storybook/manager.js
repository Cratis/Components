// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

const urlParams = new URLSearchParams(window.location.search);
let currentTheme = urlParams.get('docsSiteTheme') ?? 'dark';

addons.setConfig({
    theme: currentTheme === 'light' ? themes.light : themes.dark,
    navSize: 300,
    bottomPanelHeight: 300,
    panelPosition: 'bottom',
    showToolbar: true,
    showTabs: true,
});

// Relay the current theme to the preview canvas whenever a story renders,
// so the PrimeReact component theme stays in sync with the docs-site preference.
addons.getChannel().on('STORY_RENDERED', () => {
    addons.getChannel().emit('STORYBOOK_THEME_CHANGE', { theme: currentTheme });
});

// Receive theme-sync messages from the embedding docs site (StorybookEmbed.astro).
// Reload the manager with the new theme in the URL so addons.setConfig takes effect.
window.addEventListener('message', (event) => {
    if (event.data?.type !== 'STORYBOOK_THEME_CHANGE') return;
    const newTheme = event.data.theme;
    if (currentTheme === newTheme) return;
    currentTheme = newTheme;
    const url = new URL(window.location.href);
    url.searchParams.set('docsSiteTheme', newTheme);
    window.location.href = url.toString();
});
