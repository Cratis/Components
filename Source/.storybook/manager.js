// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

const urlParams = new URLSearchParams(window.location.search);
let followsDocsSiteTheme = urlParams.has('docsSiteTheme');
let currentTheme = urlParams.get('docsSiteTheme') ?? 'dark';

const applyManagerConfig = () => {
    addons.setConfig({
        theme: currentTheme === 'light' ? themes.light : themes.dark,
        navSize: 300,
        bottomPanelHeight: 300,
        panelPosition: 'bottom',
        showToolbar: true,
        showTabs: true,
    });
};

applyManagerConfig();

// Relay the current theme to the preview canvas whenever a story renders,
// so the Cratis baseline stays in sync with the docs-site preference.
addons.getChannel().on('STORY_RENDERED', () => {
    if (followsDocsSiteTheme) {
        addons.getChannel().emit('STORYBOOK_THEME_CHANGE', { theme: currentTheme });
    }
});

// Receive theme-sync messages from the embedding docs site (StorybookEmbed.astro).
window.addEventListener('message', (event) => {
    if (event.data?.type !== 'STORYBOOK_THEME_CHANGE') return;
    const newTheme = event.data.theme;
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    followsDocsSiteTheme = true;
    if (currentTheme === newTheme) return;
    currentTheme = newTheme;
    applyManagerConfig();
    addons.getChannel().emit('STORYBOOK_THEME_CHANGE', { theme: currentTheme });
});
