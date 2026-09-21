// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { TagGroup } from '../TagGroup';
import {
    mountPrimitive,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

const press = async (element: Element, key: string) => {
    await act(async () => {
        element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
        await Promise.resolve();
    });
};

const focusFirstTag = async (mounted: MountedPrimitive) => {
    const [first] = Array.from(
        mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="tag"]'),
    );
    await act(async () => {
        first.focus();
        first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
        await Promise.resolve();
    });
    return first;
};

describe('when removing a tag and the group is disabled', () => {
    let mounted: MountedPrimitive;
    const changes: string[][] = [];

    afterEach(async () => {
        await unmountPrimitive(mounted);
    });

    it('should leave the value unchanged on Delete', async () => {
        changes.length = 0;
        mounted = await mountPrimitive(
            <TagGroup
                value={['react', 'typescript']}
                aria-label='Skills'
                disabled
                removeLabel={(entry) => `Remove ${entry}`}
                onChange={(next) => changes.push(next)}
            />,
        );
        const first = await focusFirstTag(mounted);
        await press(document.activeElement ?? first, 'Delete');
        expect(changes).to.deep.equal([]);
    });

    it('should still remove the tag on Delete when the group is enabled', async () => {
        changes.length = 0;
        mounted = await mountPrimitive(
            <TagGroup
                value={['react', 'typescript']}
                aria-label='Skills'
                removeLabel={(entry) => `Remove ${entry}`}
                onChange={(next) => changes.push(next)}
            />,
        );
        const first = await focusFirstTag(mounted);
        await press(document.activeElement ?? first, 'Delete');
        expect(changes.at(-1)).to.deep.equal(['typescript']);
    });
});
