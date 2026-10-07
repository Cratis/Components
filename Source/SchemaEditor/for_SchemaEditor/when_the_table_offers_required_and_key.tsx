// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';
import { TableMount } from './TableMount';

const schema = (): JsonSchema => ({
    type: 'object',
    properties: {
        id: { type: 'string', ['x-key' as string]: true } as never,
        name: { type: 'string' },
        address: { type: 'object', properties: { street: { type: 'string' } } },
    },
    required: ['id'],
});

const keyOf = (value: JsonSchema, name: string) =>
    (value.properties![name] as unknown as Record<string, unknown>)['x-key'];

describe('when the table offers the required and key columns', () => {
    let mount: TableMount;
    const changes: JsonSchema[] = [];

    beforeEach(async () => {
        changes.length = 0;
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={schema()} editMode allowRequired allowKeyProperty onChange={changed => changes.push(changed)} />);
    });

    afterEach(() => mount.unmount());

    it('should add the columns', () => expect(mount.headers()).to.deep.equal(['Property', 'Required', 'Key', 'Type']));

    it('should show what the schema says', () => {
        expect(mount.input('Required in schema: id').checked).to.equal(true);
        expect(mount.input('Required in schema: name').checked).to.equal(false);
        expect(mount.input('Use id as the key property').checked).to.equal(true);
    });

    it('should add a property to the required list', async () => {
        await mount.click(mount.input('Required in schema: name'));
        expect(changes[0].required).to.deep.equal(['id', 'name']);
    });

    it('should drop the list when the last required property is cleared', async () => {
        await mount.click(mount.input('Required in schema: id'));
        expect(changes[0].required).to.equal(undefined);
    });

    it('should move the key so that at most one property holds it', async () => {
        await mount.click(mount.input('Use name as the key property'));
        expect(keyOf(changes[0], 'name')).to.equal(true);
        expect(keyOf(changes[0], 'id')).to.equal(undefined);
    });

    it('should clear the key when the key property is chosen again', async () => {
        await mount.click(mount.input('Use id as the key property'));
        expect(keyOf(changes[0], 'id')).to.equal(undefined);
    });
});

describe('when the table is not in edit mode', () => {
    let mount: TableMount;

    beforeEach(async () => {
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={schema()} allowRequired allowKeyProperty />);
    });

    afterEach(() => mount.unmount());

    it('should show the columns without letting them change', () => {
        expect(mount.headers()).to.include('Required');
        expect(mount.input('Required in schema: id').getAttribute('aria-readonly')).to.equal('true');
    });
});

describe('when the column labels are localized', () => {
    let mount: TableMount;

    beforeEach(async () => {
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={schema()} allowRequired allowKeyProperty labels={{ requiredColumn: 'Påkrevd', keyColumn: 'Nøkkel' }} />);
    });

    afterEach(() => mount.unmount());

    it('should use them', () => expect(mount.headers()).to.deep.equal(['Property', 'Påkrevd', 'Nøkkel', 'Type']));
});
