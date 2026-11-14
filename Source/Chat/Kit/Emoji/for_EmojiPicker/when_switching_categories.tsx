// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { userEvent, within } from 'storybook/test';
import { EmojiPicker } from '../EmojiPicker';

vi.mock('../emojiCatalog', async () => {
    const { EmojiCategoryKey } = await import('../EmojiCategoryKey');
    return { EMOJI_CATALOG: [
        { key: EmojiCategoryKey.Smileys, emojis: ['😀'] },
        { key: EmojiCategoryKey.People, emojis: [] },
        { key: EmojiCategoryKey.Nature, emojis: ['🐻'] },
    ] };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<><EmojiPicker onPick={() => undefined} /><button>Outside</button></>));
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

test('category panels are lazy, linked to their tabs and usable when empty', async () => {
    const view = within(container);
    expect(view.getAllByRole('tabpanel')).toHaveLength(1);
    expect(view.queryByRole('button', { name: '🐻' })).toBeNull();
    await userEvent.click(view.getByRole('tab', { name: 'People' }));
    const emptyPanel = view.getByRole('tabpanel', { name: 'People' });
    expect(within(emptyPanel).queryAllByRole('button')).toHaveLength(0);
    expect(emptyPanel.id).toBe(view.getByRole('tab', { name: 'People' }).getAttribute('aria-controls'));
    await userEvent.keyboard('{ArrowRight}');
    expect(view.getAllByRole('tabpanel')).toHaveLength(1);
    expect(view.queryByRole('button', { name: '😀' })).toBeNull();
    const panel = view.getByRole('tabpanel', { name: 'Animals & nature' });
    expect(within(panel).getByRole('button', { name: '🐻' }).tabIndex).toBe(0);
    await userEvent.tab();
    expect(document.activeElement).toBe(within(panel).getByRole('button', { name: '🐻' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(view.getByRole('button', { name: 'Outside' }));
});
