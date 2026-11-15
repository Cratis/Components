// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { TagGroup } from '../TagGroup';
import {
    mountPrimitive,
    setNativeValue,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

const Harness = ({
    initial = ['alpha', 'alpha', 'beta'],
    onValue,
    allowDuplicates = true,
    disabled = false,
}: {
    initial?: string[];
    onValue: (value: string[]) => void;
    allowDuplicates?: boolean;
    disabled?: boolean;
}) => {
    const [value, setValue] = useState(initial);
    return <TagGroup value={value} aria-label='Tags' allowDuplicates={allowDuplicates}
        disabled={disabled} onChange={(next) => { setValue(next); onValue(next); }} />;
};

const press = async (element: Element, key: string) => {
    await act(async () => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    });
};

const focus = async (element: HTMLElement) => {
    await act(async () => {
        element.focus();
        element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
};

const tags = (mounted: MountedPrimitive) =>
    Array.from(mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="tag"]'));
const input = (mounted: MountedPrimitive) =>
    mounted.container.querySelector<HTMLInputElement>('input')!;
const remove = async (mounted: MountedPrimitive, index: number) => {
    await focus(tags(mounted)[index]);
    await press(document.activeElement!, 'Delete');
};

describe('when removing duplicate occurrences', () => {
    const mounts: MountedPrimitive[] = [];
    const changes: string[][] = [];
    const mount = async (initial?: string[], allowDuplicates = true, disabled = false) => {
        const mounted = await mountPrimitive(<Harness initial={initial} allowDuplicates={allowDuplicates}
            disabled={disabled} onValue={(value) => changes.push(value)} />);
        mounts.push(mounted);
        return mounted;
    };

    afterEach(async () => {
        for (const mounted of mounts) await unmountPrimitive(mounted);
        mounts.length = 0;
        changes.length = 0;
    });

    it('should render every initial occurrence with a distinct identity', async () => {
        const mounted = await mount();
        expect(tags(mounted).map((tag) => tag.textContent)).to.deep.equal(['alpha×', 'alpha×', 'beta×']);
        expect(new Set(tags(mounted).map((tag) => tag.id)).size).to.equal(3);
    });

    it('should remove only one equal value and call back once', async () => {
        const mounted = await mount();
        await remove(mounted, 0);
        expect(changes).to.deep.equal([['alpha', 'beta']]);
    });

    it('should add an equal value when duplicates are allowed', async () => {
        const mounted = await mount(['alpha']);
        await setNativeValue(input(mounted), 'alpha');
        await press(input(mounted), 'Enter');
        expect(changes).to.deep.equal([['alpha', 'alpha']]);
        expect(tags(mounted)).to.have.length(2);
    });

    it('should remove only the last occurrence from an empty entry', async () => {
        const mounted = await mount(['alpha', 'beta', 'alpha']);
        const first = tags(mounted)[0];
        await press(input(mounted), 'Backspace');
        expect(changes).to.deep.equal([['alpha', 'beta']]);
        expect(tags(mounted)[0]).to.equal(first);
    });

    it('should preserve the surviving duplicate and focus after removing the earlier one', async () => {
        const mounted = await mount();
        const second = tags(mounted)[1];
        await remove(mounted, 0);
        expect(tags(mounted)[0]).to.equal(second);
        expect(document.activeElement).to.equal(second);
        await press(document.activeElement!, 'Delete');
        expect(changes).to.deep.equal([['alpha', 'beta'], ['beta']]);
    });

    it('should remove supplied duplicates even when duplicate additions are forbidden', async () => {
        const mounted = await mount(undefined, false);
        await setNativeValue(input(mounted), 'alpha');
        await press(input(mounted), 'Enter');
        expect(changes).to.deep.equal([]);
        await remove(mounted, 1);
        expect(changes).to.deep.equal([['alpha', 'beta']]);
    });

    it('should not confuse separator-like labels with private keys', async () => {
        const values = ['alpha:0', 'alpha', 'alpha:0', 'alpha-1', '0'];
        const mounted = await mount(values);
        await remove(mounted, 2);
        expect(changes).to.deep.equal([['alpha:0', 'alpha', 'alpha-1', '0']]);
    });

    it('should keep the identities and removals of two instances independent', async () => {
        const first = await mount();
        const second = await mount();
        const secondIds = tags(second).map((tag) => tag.id);
        expect(new Set([...tags(first).map((tag) => tag.id), ...secondIds]).size).to.equal(6);
        await remove(first, 0);
        expect(tags(second).map((tag) => tag.id)).to.deep.equal(secondIds);
        expect(tags(second)).to.have.length(3);
    });

    it('should leave disabled duplicate occurrences unchanged', async () => {
        const mounted = await mount(undefined, true, true);
        await remove(mounted, 0);
        expect(changes).to.deep.equal([]);
        expect(mounted.container.querySelector('[data-cratis-part="remove"]')).to.equal(null);
        expect(input(mounted).disabled).to.equal(true);
    });

    it('should match external replacements by the nth prior occurrence and preserve focus on reorder', async () => {
        const onChange = (value: string[]) => changes.push(value);
        const mounted = await mountPrimitive(<TagGroup value={['alpha', 'alpha', 'beta']} onChange={onChange} aria-label='Tags' />);
        mounts.push(mounted);
        const [first, second, beta] = tags(mounted);
        await focus(beta);
        await act(async () => mounted.root.render(<TagGroup value={['beta', 'alpha', 'alpha', 'gamma']} onChange={onChange} aria-label='Tags' />));
        expect(tags(mounted).slice(0, 3)).to.deep.equal([beta, first, second]);
        expect(document.activeElement).to.equal(beta);
        await act(async () => mounted.root.render(<TagGroup value={['alpha', 'beta']} onChange={onChange} aria-label='Tags' />));
        expect(tags(mounted)).to.deep.equal([first, beta]);
        expect(changes).to.deep.equal([]);
    });
});
