// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, describe, it } from 'vitest';
import { a_type_cell } from './given/a_type_cell';

const clickButton = (cell: a_type_cell, label: string) =>
    act(async () => cell.mount.container.querySelector<HTMLElement>(`button[aria-label="${label}"]`)!.click());

describe('when editing a scalar property', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should offer only the type and remove', async () => {
        await cell.render({ name: 'a', type: 'string' });
        expect(cell.ariaLabels()).to.deep.equal(['Property type', 'Delete property']);
    });

    it('should remove the property', async () => {
        await cell.render({ name: 'a', type: 'string' });
        await clickButton(cell, 'Delete property');
        expect(cell.onRemoveProperty.mock.calls).to.deep.equal([['a']]);
    });

    it('should not offer remove for a protected property', async () => {
        await cell.render({ name: 'a', type: 'string' }, { canRemove: false });
        expect(cell.ariaLabels()).to.deep.equal(['Property type']);
    });

    it('should not offer remove without a name', async () => {
        await cell.render({ type: 'string' } as never);
        expect(cell.ariaLabels()).to.deep.equal(['Property type']);
    });
});

describe('when editing an array of objects', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should offer the item type, item navigation and remove', async () => {
        await cell.render({ name: 'a', type: 'array', items: { type: 'object' } } as never);
        expect(cell.ariaLabels()).to.deep.equal(['Property type', 'Array item type', 'Navigate to item definition', 'Delete property']);
        expect(cell.text).to.contain('of');
    });

    it('should navigate to the array items', async () => {
        await cell.render({ name: 'a', type: 'array', items: { type: 'object' } } as never);
        await clickButton(cell, 'Navigate to item definition');
        expect(cell.onNavigateToArrayItems.mock.calls).to.deep.equal([['a']]);
    });
});

describe('when editing an array of scalars', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should not offer item navigation', async () => {
        await cell.render({ name: 'a', type: 'array', items: { type: 'string' } } as never);
        expect(cell.ariaLabels()).to.deep.equal(['Property type', 'Array item type', 'Delete property']);
    });
});

describe('when editing an object', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should navigate to the properties', async () => {
        await cell.render({ name: 'a', type: 'object' });
        expect(cell.ariaLabels()).to.deep.equal(['Property type', 'Navigate to object properties', 'Delete property']);
        await clickButton(cell, 'Navigate to object properties');
        expect(cell.onNavigateToProperty.mock.calls).to.deep.equal([['a']]);
    });
});
