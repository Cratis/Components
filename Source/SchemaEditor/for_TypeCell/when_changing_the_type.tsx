// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { a_type_cell, formats } from './given/a_type_cell';

const property = { name: 'sample', type: 'string' } as never;
const arrayProperty = { name: 'sample', type: 'array', items: { type: 'string' } } as never;

describe('when choosing a container type', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should update the type and clear the format', async () => {
        await cell.render(property);
        await cell.choose('Property type', 'object');
        expect(cell.onUpdateProperty.mock.calls).to.deep.equal([['sample', 'type', 'object', { format: undefined }]]);
    });

    it('should update the array item type for an item', async () => {
        await cell.render(arrayProperty);
        await cell.choose('Array item type', 'object');
        expect(cell.onUpdateArrayItemType.mock.calls).to.deep.equal([['sample', 'object']]);
    });
});

describe('when choosing a format', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should write the json type and the format', async () => {
        await cell.render(property, { typeFormats: formats });
        await cell.choose('Property type', 'guid');
        expect(cell.onUpdateProperty.mock.calls).to.deep.equal([['sample', 'type', 'string', { format: 'guid' }]]);
    });

    it('should clear the format for a format-less type', async () => {
        await cell.render(property, { typeFormats: formats });
        await cell.choose('Property type', 'integer');
        expect(cell.onUpdateProperty.mock.calls).to.deep.equal([['sample', 'type', 'integer', { format: undefined }]]);
    });

    it('should write only the json type for an array item', async () => {
        await cell.render(arrayProperty, { typeFormats: formats });
        await cell.choose('Array item type', 'guid');
        expect(cell.onUpdateArrayItemType.mock.calls).to.deep.equal([['sample', 'string']]);
    });
});

describe('when choosing a default type', () => {
    const cell = new a_type_cell();
    afterEach(() => cell.unmount());

    it('should write the type and clear the format', async () => {
        await cell.render(property);
        await cell.choose('Property type', 'boolean');
        expect(cell.onUpdateProperty.mock.calls).to.deep.equal([['sample', 'type', 'boolean', { format: undefined }]]);
    });

    it('should write the type for an array item', async () => {
        await cell.render(arrayProperty);
        await cell.choose('Array item type', 'number');
        expect(cell.onUpdateArrayItemType.mock.calls).to.deep.equal([['sample', 'number']]);
    });
});
