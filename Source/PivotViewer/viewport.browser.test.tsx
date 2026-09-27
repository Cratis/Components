// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import { composeStory } from '@storybook/react';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, it } from 'vitest';
import { waitFor } from 'storybook/test';
import meta, { KeyboardScrollableViewport } from './PivotViewer.stories';
import '../tokens.css';
import '../theme.css';
import '../.storybook/preview.css';
import './PivotViewer.css';

const Story = composeStory(KeyboardScrollableViewport, meta);
const host = document.createElement('div');
document.body.append(host);
const root = createRoot(host);

afterEach(() => {
    root.unmount();
    host.remove();
});

it('scrolls the overflowing Storybook card area with trusted keys and tabs out', async () => {
    root.render(<Story />);
    await waitFor(() => expect(host.querySelector('.pv-viewport')).not.toBeNull());
    const viewport = host.querySelector<HTMLDivElement>('.pv-viewport')!;
    const lastControl = host.querySelector<HTMLSelectElement>('.pv-dimension-select select')!;
    const exit = host.querySelector<HTMLButtonElement>('.storybook-wrapper > button')!;

    await waitFor(() => expect(viewport.scrollHeight - viewport.clientHeight).toBeGreaterThan(500));
    await userEvent.click(exit);
    lastControl.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(viewport);

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    viewport.scrollTo({ top: maxScrollTop, behavior: 'instant' });
    expect(viewport.scrollTop).toBe(maxScrollTop);
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(viewport.scrollTop).toBeLessThan(maxScrollTop));
    const afterArrow = viewport.scrollTop;
    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(afterArrow));
    await userEvent.tab();
    expect(document.activeElement).not.toBe(viewport);
    const results = await axe.run(host, { runOnly: ['scrollable-region-focusable'] });
    expect(results.violations).toHaveLength(0);
});
