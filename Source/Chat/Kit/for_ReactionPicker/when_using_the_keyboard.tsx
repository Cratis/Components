// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { userEvent, within } from 'storybook/test';
import { ReactionPicker } from '../ReactionPicker';

let container: HTMLDivElement;
let root: Root;

const ExamplePicker = () => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const [picked, setPicked] = useState('');
    return <>
        <button ref={anchorRef} onClick={() => setOpen(!open)}>React</button>
        <button>Outside</button>
        <output aria-label='Picked'>{picked}</output>
        {open && <ReactionPicker memory={{ getItem: () => null, setItem: () => undefined }} anchorRef={anchorRef} ownEmoji='👍' onDismiss={() => setOpen(false)} onPick={(emoji) => {
            setPicked(emoji);
            setOpen(false);
        }} />}
    </>;
};

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root.render(<ExamplePicker />));
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

test('quick reactions use roving focus, activate with Enter and restore the opener', async () => {
    const view = within(container);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    const list = view.getByRole('listbox');
    const options = within(list).getAllByRole('option');
    expect(list.querySelectorAll('[tabindex="0"]').length).toBe(1);
    expect(list.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(options.at(-1));
    await userEvent.keyboard('{Home}{ArrowRight}');
    const chosen = document.activeElement!.textContent;
    await userEvent.keyboard('{Enter}');
    expect(view.getByLabelText('Picked').textContent).toBe(chosen);
    expect(view.queryByRole('dialog')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(view.getByRole('button', { name: 'React' }));
});

test('full picker tabs and options are linked, keyboard navigable and dismissible', async () => {
    const view = within(container);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    await userEvent.click(view.getByRole('button', { name: 'All emojis' }));
    const full = view.getByRole('dialog', { name: 'All emojis' });
    const tabs = within(full).getAllByRole('tab');
    const first = tabs[0];
    expect(within(full).getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(first.id);
    expect(first.getAttribute('aria-controls')).toBe(within(full).getByRole('tabpanel').id);
    expect(within(full).getByRole('listbox').contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabs.at(-1));
    expect(tabs.at(-1)!.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(first);
    await userEvent.keyboard('{Home}');
    await userEvent.tab({ shift: true });
    expect(within(full).getByRole('listbox').contains(document.activeElement)).toBe(true);
    await userEvent.keyboard(' ');
    expect(view.getByLabelText('Picked').textContent).not.toBe('');
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    await userEvent.keyboard('{Escape}');
    expect(view.queryByRole('dialog')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(view.getByRole('button', { name: 'React' }));
});

test('pointer selection and outside dismissal remain available', async () => {
    const view = within(container);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    const option = view.getAllByRole('option')[0];
    const chosen = option.textContent;
    await userEvent.click(option);
    expect(view.getByLabelText('Picked').textContent).toBe(chosen);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    await userEvent.click(view.getByRole('button', { name: 'Outside' }));
    expect(view.queryByRole('dialog')).toBeNull();
});
