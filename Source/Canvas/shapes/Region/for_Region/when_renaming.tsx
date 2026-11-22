// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { act } from 'react';
import { should } from 'chai';
import { afterEach, describe, it, vi } from 'vitest';
import { setNativeValue, unmountPrimitive } from '../../../../Common/for_Primitives/given/a_primitive_dom';
import { mountRegion, pointAt } from './given/a_region';

should();

describe('when renaming a region', () => {
    let mounted: Awaited<ReturnType<typeof mountRegion>>;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
    });

    const startEditing = async () => {
        await pointAt(mounted.title, 'pointerdown');
        await pointAt(mounted.element, 'pointerup');
        await pointAt(mounted.title, 'dblclick');
        return mounted.element.querySelector<HTMLInputElement>('input')!;
    };

    it('should edit only after a title gesture and commit trimmed names on Enter', async () => {
        mounted = await mountRegion({ children: <span>Example Child</span> });
        await pointAt(mounted.element, 'dblclick');
        should().not.exist(mounted.element.querySelector('input'));
        const input = await startEditing();
        input.defaultValue.should.equal('Example Region');
        await setNativeValue(input, '  Updated Region  ');
        await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
        vi.mocked(mounted.props.onNameChange).mock.calls.should.deep.equal([['sample-region', 'Updated Region']]);
        mounted.element.querySelector('.canvas-region__name')!.textContent!.should.equal('Example Region');
        mounted.element.nextElementSibling!.className.should.equal('canvas-region__items');
        mounted.element.nextElementSibling!.textContent!.should.equal('Example Child');
    });

    it('should ignore unchanged or blank names on blur and discard Escape edits', async () => {
        mounted = await mountRegion();
        for (const name of [' Example Region ', '   ']) {
            const input = await startEditing();
            await setNativeValue(input, name);
            await act(async () => { input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); });
        }
        const input = await startEditing();
        await setNativeValue(input, 'Discarded Region');
        await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
        vi.mocked(mounted.props.onNameChange).mock.calls.should.deep.equal([]);
        should().not.exist(mounted.element.querySelector('input'));
    });
});
