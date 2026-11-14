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
        <output aria-label='Picked'>{picked}</output>
        {open && <ReactionPicker memory={{ getItem: () => null, setItem: () => undefined }} anchorRef={anchorRef} ownEmoji='👍' onDismiss={() => setOpen(false)} onPick={(emoji) => {
            setPicked(emoji);
            setOpen(false);
        }} />}
        <button>Outside</button>
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

test('quick reactions are pressed-state actions with one collection entry', async () => {
    const view = within(container);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    const group = view.getByRole('group', { name: 'Pick an emoji' });
    const choices = within(group).getAllByRole('button');
    expect(group.querySelectorAll('[tabindex="0"]').length).toBe(1);
    expect(within(group).getByRole('button', { name: '👍', pressed: true })).toBe(choices[0]);
    expect(container.querySelector('[role="listbox"], [role="option"], [aria-selected]')).toBeNull();
    expect(group.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(choices.at(-1));
    await userEvent.keyboard('{Home}{ArrowRight}');
    const chosen = document.activeElement!.textContent;
    await userEvent.keyboard('{Enter}');
    expect(view.getByLabelText('Picked').textContent).toBe(chosen);
    expect(view.queryByRole('group')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(view.getByRole('button', { name: 'React' }));
});

test('full picker tabs and button groups are linked and keyboard navigable', async () => {
    const view = within(container);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    await userEvent.click(view.getByRole('button', { name: 'All emojis' }));
    const full = view.getByRole('group', { name: 'All emojis' });
    const tabs = within(full).getAllByRole('tab');
    const first = tabs[0];
    expect(within(full).getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(first.id);
    expect(first.getAttribute('aria-controls')).toBe(within(full).getByRole('tabpanel').id);
    const choices = within(full).getByRole('group', { name: 'Pick an emoji' });
    await expect.poll(() => document.activeElement).toBe(first);
    expect(choices.querySelector('[role="option"], [aria-selected]')).toBeNull();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabs.at(-1));
    expect(tabs.at(-1)!.getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(first);
    await userEvent.keyboard('{Home}');
    await userEvent.tab();
    expect(within(full).getByRole('group', { name: 'Pick an emoji' }).contains(document.activeElement)).toBe(true);
    await userEvent.keyboard(' ');
    expect(view.getByLabelText('Picked').textContent).not.toBe('');
});

test('Tab can leave the quick picker and Escape returns focus to the opener', async () => {
    const view = within(container);
    const opener = view.getByRole('button', { name: 'React' });
    await userEvent.click(opener);
    await userEvent.tab();
    expect(document.activeElement).toBe(view.getByRole('button', { name: 'All emojis' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(view.getByRole('button', { name: 'Outside' }));
    await userEvent.tab({ shift: true });
    await userEvent.keyboard('{Escape}');
    expect(view.queryByRole('group')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(opener);
});

test('the full picker permits focus back to the quick row and toggle, and Tab outside', async () => {
    const view = within(container);
    const opener = view.getByRole('button', { name: 'React' });
    await userEvent.click(opener);
    const toggle = view.getByRole('button', { name: 'All emojis' });
    await userEvent.click(toggle);
    await expect.poll(() => document.activeElement).toBe(view.getAllByRole('tab')[0]);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(toggle);
    await userEvent.tab({ shift: true });
    expect(view.getAllByRole('group', { name: 'Pick an emoji' })[0].contains(document.activeElement)).toBe(true);
    await userEvent.click(toggle);
    expect(view.queryByRole('group', { name: 'All emojis' })).toBeNull();
    await userEvent.click(toggle);
    await expect.poll(() => document.activeElement).toBe(view.getAllByRole('tab')[0]);
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(view.getByRole('button', { name: 'Outside' }));
    await userEvent.tab({ shift: true });
    await userEvent.keyboard('{Escape}');
    expect(view.queryByRole('group')).toBeNull();
    await expect.poll(() => document.activeElement).toBe(opener);
});

test('pointer selection and outside dismissal remain available', async () => {
    const view = within(container);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    const choice = within(view.getByRole('group', { name: 'Pick an emoji' })).getAllByRole('button')[0];
    const chosen = choice.textContent;
    await userEvent.click(choice);
    expect(view.getByLabelText('Picked').textContent).toBe(chosen);
    await userEvent.click(view.getByRole('button', { name: 'React' }));
    await userEvent.click(view.getByRole('button', { name: 'Outside' }));
    expect(view.queryByRole('group')).toBeNull();
});
