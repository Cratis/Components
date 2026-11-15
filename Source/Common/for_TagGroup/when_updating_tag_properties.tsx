// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { TagGroup, type TagGroupProps } from '../TagGroup';
import {
    mountPrimitive,
    unmountPrimitive,
    type MountedPrimitive,
} from '../for_Primitives/given/a_primitive_dom';

describe('when updating tag properties', () => {
    let mounted: MountedPrimitive;
    let value: string[];
    const changes: string[][] = [];
    const render = (props: Partial<TagGroupProps> = {}) => (
        <TagGroup value={value} onChange={(next) => changes.push(next)} aria-label='Tags' {...props} />
    );
    const mount = async (props: Partial<TagGroupProps> = {}) => {
        value = ['alpha', 'alpha', 'beta'];
        mounted = await mountPrimitive(render(props));
    };
    const update = async (props: Partial<TagGroupProps> = {}) => {
        await act(async () => mounted.root.render(render(props)));
    };
    const tags = () => Array.from(mounted.container.querySelectorAll<HTMLElement>('[data-cratis-part="tag"]'));
    const buttons = () => Array.from(mounted.container.querySelectorAll<HTMLButtonElement>('[data-cratis-part="remove"]'));

    afterEach(async () => {
        await unmountPrimitive(mounted);
        changes.length = 0;
    });

    it('should update disabled tags and hide their remove buttons without replacing their identities', async () => {
        await mount();
        const previous = tags();
        await update({ disabled: true });
        expect(buttons()).to.have.length(0);
        expect(tags().every((tag) => tag.hasAttribute('data-disabled'))).to.equal(true);
        expect(tags()).to.deep.equal(previous);
        expect(changes).to.deep.equal([]);
    });

    it('should show remove buttons when disabled tags become enabled', async () => {
        await mount({ disabled: true });
        await update({ disabled: false });
        expect(buttons()).to.have.length(3);
        expect(tags().every((tag) => !tag.hasAttribute('data-disabled'))).to.equal(true);
    });

    it('should update accessible remove names when the label function changes', async () => {
        await mount({ removeLabel: (label) => `Remove ${label}` });
        await update({ removeLabel: (label) => `Delete ${label}` });
        expect(buttons().map((button) => button.getAttribute('aria-label')))
            .to.deep.equal(['Delete alpha', 'Delete alpha', 'Delete beta']);
    });

    it('should update remove icons when the icon changes', async () => {
        await mount({ removeIcon: 'old-icon' });
        await update({ removeIcon: 'new-icon' });
        expect(buttons().map((button) => button.textContent))
            .to.deep.equal(['new-icon', 'new-icon', 'new-icon']);
    });

    it('should update tag and remove part attributes', async () => {
        await mount({ pt: { tag: { className: 'old-tag' }, remove: { className: 'old-remove' } } });
        expect(tags().every((tag) => tag.classList.contains('old-tag'))).to.equal(true);
        expect(buttons().every((button) => button.classList.contains('old-remove'))).to.equal(true);
        await update({ pt: { tag: { className: 'new-tag' }, remove: { className: 'new-remove' } } });
        expect(tags().every((tag) => tag.classList.contains('new-tag'))).to.equal(true);
        expect(buttons().every((button) => button.classList.contains('new-remove'))).to.equal(true);
    });

    it('should preserve identities for the same array and an equal new array', async () => {
        await mount();
        const previous = tags();
        await update();
        expect(tags()).to.deep.equal(previous);
        value = [...value];
        await update();
        expect(tags()).to.deep.equal(previous);
        expect(changes).to.deep.equal([]);
    });

    it('should reconcile an in-place array update when the owner renders again', async () => {
        await mount();
        const [first, , beta] = tags();
        value.splice(1, 1);
        await update();
        expect(tags()).to.deep.equal([first, beta]);
        expect(changes).to.deep.equal([]);
    });
});
