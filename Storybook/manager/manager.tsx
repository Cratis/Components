// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { addons, types, useStorybookApi, useStorybookState } from 'storybook/manager-api';
import { themes } from 'storybook/theming';
import {
    canonicalRendererStoryId,
    resolveRendererSelection,
} from './renderer-navigation';

const addonId = 'cratis/renderer-switcher';
const toolId = `${addonId}/tool`;

const RendererSwitcher = () => {
    const api = useStorybookApi();
    const state = useStorybookState();
    const refs = state.refs;
    const selectedRef = state.refId as string | undefined;
    const selectedStoryId = canonicalRendererStoryId(state.storyId, selectedRef);
    const rendererRefs = Object.values(refs).sort((left, right) =>
        (left.title ?? left.id).localeCompare(right.title ?? right.id),
    );

    return (
        <label
            title='Changing renderer remounts the preview iframe and does not preserve local story state.'
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                paddingInline: 8,
            }}
        >
            <span style={{ fontSize: 12, fontWeight: 600 }}>Renderer</span>
            <select
                aria-label='Renderer'
                value={selectedRef ?? ''}
                disabled={rendererRefs.length === 0}
                onChange={(event) => {
                    const refId = event.currentTarget.value;
                    const selection = resolveRendererSelection(
                        selectedStoryId,
                        state.viewMode ?? 'story',
                        refId,
                        refs[refId],
                    );
                    if (!selection) return;
                    api.selectStory(selection.storyId, undefined, {
                        ref: selection.refId,
                        viewMode: selection.viewMode,
                    });
                }}
                style={{ minWidth: 190, height: 28, borderRadius: 4 }}
            >
                {!selectedRef && <option value=''>Choose renderer</option>}
                {rendererRefs.map((ref) => (
                    <option key={ref.id} value={ref.id}>
                        {ref.title ?? ref.id}
                    </option>
                ))}
            </select>
        </label>
    );
};

const urlParams = new URLSearchParams(window.location.search);
let followsDocsSiteTheme = urlParams.has('docsSiteTheme');
let currentTheme = urlParams.get('docsSiteTheme') ?? 'dark';

const applyManagerConfig = () => {
    addons.setConfig({
        theme: currentTheme === 'light' ? themes.light : themes.dark,
        layout: {
            navSize: 300,
            bottomPanelHeight: 300,
            panelPosition: 'bottom',
            showToolbar: true,
            showTabs: true,
        },
    });
};

applyManagerConfig();
addons.register(addonId, () => {
    addons.add(toolId, {
        id: toolId,
        type: types.TOOL,
        title: 'Renderer',
        render: () => <RendererSwitcher />,
    });
});

addons.getChannel().on('STORY_RENDERED', () => {
    if (followsDocsSiteTheme) {
        addons.getChannel().emit('STORYBOOK_THEME_CHANGE', { theme: currentTheme });
    }
});

window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    if (event.data?.type !== 'STORYBOOK_THEME_CHANGE') return;
    const newTheme = event.data.theme;
    if (newTheme !== 'light' && newTheme !== 'dark') return;
    followsDocsSiteTheme = true;
    if (currentTheme === newTheme) return;
    currentTheme = newTheme;
    applyManagerConfig();
    addons.getChannel().emit('STORYBOOK_THEME_CHANGE', { theme: currentTheme });
});
