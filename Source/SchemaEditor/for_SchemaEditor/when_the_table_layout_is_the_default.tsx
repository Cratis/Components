// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';
import { TableMount } from './TableMount';

const schema: JsonSchema = {
    type: 'object',
    properties: { name: { type: 'string' }, address: { type: 'object', properties: { street: { type: 'string' } } } },
    required: ['name'],
};

/** Generated ids differ between two mounts; everything else must match. */
const stable = (markup: string) => markup.replace(/(react-aria|:r)[\w-]*:?/g, 'id');

describe('when the layout is not given', () => {
    let withoutLayout: TableMount;
    let withTableLayout: TableMount;

    beforeEach(async () => {
        withoutLayout = new TableMount();
        withTableLayout = new TableMount();
        await withoutLayout.render(<SchemaEditor schema={schema} editMode />);
        await withTableLayout.render(<SchemaEditor schema={schema} editMode layout='table' />);
    });

    afterEach(async () => {
        await withoutLayout.unmount();
        await withTableLayout.unmount();
    });

    it('should render the table markup exactly as the table layout does', () =>
        expect(stable(withoutLayout.container.innerHTML)).to.equal(stable(withTableLayout.container.innerHTML)));

    it('should keep the editor root class and the Property and Type columns only', () => {
        expect(withoutLayout.container.querySelector('.schema-editor')).to.not.equal(null);
        expect(withoutLayout.headers()).to.deep.equal(['Property', 'Type']);
    });

    it('should render none of the tree layout', () => {
        expect(withoutLayout.container.querySelector('.cratis-schema-editor')).to.equal(null);
    });

    it('should keep the edit workflow', () => {
        expect(withoutLayout.button('Save')).to.not.equal(undefined);
        expect(withoutLayout.button('Cancel')).to.not.equal(undefined);
        expect(withoutLayout.button('Add Property')).to.not.equal(undefined);
    });
});

describe('when only existing labels are overridden', () => {
    let mount: TableMount;

    beforeEach(async () => {
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={schema} editMode labels={{ save: 'Lagre', emptyMessage: 'Ingen' }} />);
    });

    afterEach(() => mount.unmount());

    it('should use them and keep the English default of the rest', () => {
        expect(mount.button('Lagre')).to.not.equal(undefined);
        expect(mount.button('Cancel')).to.not.equal(undefined);
    });
});

describe('when the schema carries tree keywords the table does not show', () => {
    let mount: TableMount;
    const changes: JsonSchema[] = [];
    const keyed: JsonSchema = {
        type: 'object',
        properties: { id: { type: 'string', ['x-key' as string]: true } as never, name: { type: 'string' } },
    };

    beforeEach(async () => {
        changes.length = 0;
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={keyed} editMode onChange={changed => changes.push(changed)} />);
        await mount.type(mount.container.querySelectorAll<HTMLInputElement>('input[aria-label="Property name"]')[1], 'title');
    });

    afterEach(() => mount.unmount());

    it('should keep them through an edit', () =>
        expect((changes[0].properties!.id as unknown as Record<string, unknown>)['x-key']).to.equal(true));
});
