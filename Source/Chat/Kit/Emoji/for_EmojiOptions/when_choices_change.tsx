// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { userEvent, within } from 'storybook/test';
import { EmojiOptions } from '../EmojiOptions';

let container: HTMLDivElement;
let root: Root;

const renderChoices = async (emojis: readonly string[], columns = 1) => {
    await act(async () => root.render(<EmojiOptions emojis={emojis} columns={columns} ownEmoji='👍' label='Example choices' className='' optionClassName='' onPick={() => undefined} />));
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

test('item removal, reordering and empty-to-populated changes retain one valid entry', async () => {
    await renderChoices(['👍', '❤️', '🎉']);
    await userEvent.click(within(container).getByRole('button', { name: '🎉' }));
    await renderChoices(['❤️']);
    expect(within(container).getByRole('button', { name: '❤️' }).tabIndex).toBe(0);
    await renderChoices([]);
    expect(within(container).queryAllByRole('button')).toHaveLength(0);
    await renderChoices(['👍', '❤️']);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    await userEvent.click(within(container).getByRole('button', { name: '👍' }));
    await renderChoices(['❤️', '👍']);
    expect(within(container).getByRole('button', { name: '👍', pressed: true }).tabIndex).toBe(0);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
});

test('vertical arrows preserve columns and stay put at the edges of an incomplete row', async () => {
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂'];
    await renderChoices(emojis, 8);
    const choices = within(container).getAllByRole('button');
    await userEvent.click(choices[1]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(choices[1]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(choices[9]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(choices[9]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(choices[1]);
    await userEvent.click(choices[7]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(choices[7]);
    await userEvent.keyboard('{End}{ArrowRight}');
    expect(document.activeElement).toBe(choices[0]);
});
