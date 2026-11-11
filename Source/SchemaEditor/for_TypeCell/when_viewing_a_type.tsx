// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { a_type_cell } from './given/a_type_cell';

const view = async (cell: a_type_cell, rowData: Parameters<a_type_cell['render']>[0]) =>
    cell.render(rowData, { isEditMode: false });

describe('when viewing a scalar type', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should show the format when there is one', async () => {
        await view(cell, { name: 'a', type: 'string', format: 'guid' });
        expect(cell.html).to.equal('guid');
    });

    it('should show the type without a format', async () => {
        await view(cell, { name: 'a', type: 'integer' });
        expect(cell.html).to.equal('integer');
    });
});

describe('when viewing an array of objects', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should offer navigation with the arrow', async () => {
        await view(cell, { name: 'a', type: 'array', items: { type: 'object' } } as never);
        expect(cell.html).to.equal(
            '<div class="cratis:flex cratis:items-center cratis:gap-2 cratis:w-full" style="height: 100%;" title="Click to navigate to item definition"><span>Array of object</span><div style="flex: 1 1 0%;"></div><span style="display: flex; align-items: center;"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" style="color: var(--cratis-primary-color); font-size: 1rem;" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"></path></svg></span></div>',
        );
    });
});

describe('when viewing an array of scalars', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should show the item type without title or arrow', async () => {
        await view(cell, { name: 'a', type: 'array', items: { type: 'integer' } } as never);
        expect(cell.html).to.equal(
            '<div class="cratis:flex cratis:items-center cratis:gap-2 cratis:w-full" style="height: 100%;"><span>Array of integer</span></div>',
        );
    });

    it('should default the item type to string', async () => {
        await view(cell, { name: 'a', type: 'array' });
        expect(cell.text).to.equal('Array of string');
    });
});

describe('when viewing an object', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should offer navigation with the arrow', async () => {
        await view(cell, { name: 'a', type: 'object' });
        expect(cell.html).to.contain('title="Click to navigate to object properties"');
        expect(cell.html).to.contain('<span>Object</span><div style="flex: 1 1 0%;"></div><span style="display: flex; align-items: center;"><svg');
    });
});
