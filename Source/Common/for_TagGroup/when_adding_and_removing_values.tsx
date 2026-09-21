// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { TagGroup } from '../TagGroup';
import {
    mountPrimitive,
    setNativeValue,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

const Harness = ({ onValue }: { onValue: (value: string[]) => void }) => {
    const [value, setValue] = useState(['react', 'typescript']);
    return (
        <TagGroup
            value={value}
            aria-label='Skills'
            removeLabel={(entry) => `Remove ${entry}`}
            onChange={(next) => {
                setValue(next);
                onValue(next);
            }}
        />
    );
};

const press = async (element: Element, key: string) => {
    await act(async () => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        await Promise.resolve();
    });
};

describe('when adding and removing values', () => {
    let mounted: MountedPrimitive;
    const changes: string[][] = [];
    const input = () =>
        mounted.container.querySelector<HTMLInputElement>('[data-cratis-part="input"]')!;
    const tags = () =>
        Array.from(mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="tag"]'));

    beforeEach(async () => {
        changes.length = 0;
        mounted = await mountPrimitive(<Harness onValue={(value) => changes.push(value)} />);
    });

    afterEach(async () => {
        await unmountPrimitive(mounted);
    });

    it('should render every value as a focusable tag', () => {
        expect(tags().map((tag) => tag.textContent)).to.deep.equal([
            'react×',
            'typescript×',
        ]);
        expect(tags().every((tag) => tag.hasAttribute('tabindex'))).to.equal(true);
    });

    it('should name each remove action with its value', () => {
        const removes = Array.from(
            mounted.container.querySelectorAll('[data-cratis-part="remove"]'),
        );
        expect(removes.map((remove) => remove.getAttribute('aria-label'))).to.deep.equal([
            'Remove react',
            'Remove typescript',
        ]);
    });

    it('should add the typed value on Enter', async () => {
        await setNativeValue(input(), 'mobx');
        await press(input(), 'Enter');
        expect(changes.at(-1)).to.deep.equal(['react', 'typescript', 'mobx']);
    });

    it('should add the typed value on a separator', async () => {
        await setNativeValue(input(), 'vitest');
        await press(input(), ',');
        expect(changes.at(-1)).to.deep.equal(['react', 'typescript', 'vitest']);
    });

    it('should refuse a duplicate', async () => {
        await setNativeValue(input(), 'react');
        await press(input(), 'Enter');
        expect(changes).to.deep.equal([]);
    });

    it('should remove the last value with Backspace on an empty entry', async () => {
        await press(input(), 'Backspace');
        expect(changes.at(-1)).to.deep.equal(['react']);
    });

    it('should remove a tag with Delete', async () => {
        const [first] = tags();
        await act(async () => {
            first.focus();
            first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
            await Promise.resolve();
        });
        await press(document.activeElement!, 'Delete');
        expect(changes.at(-1)).to.deep.equal(['typescript']);
    });
});
