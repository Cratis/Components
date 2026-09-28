// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createRoot } from 'react-dom/client';
import { composeStory } from '@storybook/react';
import { page, userEvent } from 'vitest/browser';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { waitFor, within } from 'storybook/test';
import meta, { SideDialogWithClassicScrollbars } from './FilterPanelInDialog.stories';
import '../tokens.css';
import '../theme.css';
import '../.storybook/preview.css';
import '../Dialogs/Dialog.css';
import './FilterPanel.css';

const Story = composeStory(SideDialogWithClassicScrollbars, meta);
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(async () => {
    await page.viewport(1024, 768);
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
});

afterEach(() => {
    root.unmount();
    host.remove();
});

it('does not clip a fixed filter panel to the Dialog root when classic scrollbars occupy the viewport', async () => {
    root.render(<Story />);
    await waitFor(() => expect(window.innerWidth - document.documentElement.clientWidth).toBeGreaterThan(0));
    await userEvent.click(within(host).getByRole('button', { name: 'Open scrollable side dialog' }));
    const dialog = await within(document.body).findByRole('dialog', { name: 'Scrollable side filters' });
    const dialogRoot = dialog.closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]')!;
    await waitFor(() => expect(dialogRoot.hasAttribute('data-entering')).toBe(false), { timeout: 5000 });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Scrollbar filter trigger' }));
    const panel = await within(document.body).findByRole('dialog', { name: 'Scrollable side choices' });
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'), { timeout: 5000 });
    const clip = dialogRoot.getBoundingClientRect();
    const bounds = panel.getBoundingClientRect();
    expect(window.innerWidth - document.documentElement.clientWidth).toBeGreaterThan(0);
    expect(bounds.width).toBeGreaterThan(300);
    expect(bounds.right).toBeGreaterThan(clip.right + 80);
    expect(panel.contains(document.elementFromPoint(clip.right + 16, bounds.top + 20))).toBe(true);
});
