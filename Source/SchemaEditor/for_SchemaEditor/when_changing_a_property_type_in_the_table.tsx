// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';
import { TableMount } from './TableMount';

const schema = {
    type: 'object',
    properties: {
        sample: {
            type: 'string', description: 'Shown to people', minLength: 2, pattern: '^a', enum: ['ab'], default: 'ab', 'x-sample': [1],
        },
    },
} as unknown as JsonSchema;

const integerSchema = {
    type: 'object',
    properties: { sample: { type: 'integer', description: 'Shown to people', minimum: 1, multipleOf: 2, default: 4 } },
} as unknown as JsonSchema;

const sample = (changes: JsonSchema[]) => changes[changes.length - 1].properties!.sample as unknown as Record<string, unknown>;

const chooseNumber = async (mount: TableMount, source: JsonSchema, changes: JsonSchema[]) => {
    await mount.render(<SchemaEditor schema={source} editMode onChange={changed => changes.push(changed)} />);
    await act(async () => mount.container.querySelector<HTMLElement>('[aria-label="Property type"]')!.click());
    const option = Array.from(document.querySelectorAll<HTMLElement>('[data-cratis-part="option"]')).find(candidate => candidate.textContent === 'number');
    await act(async () => option!.click());
};

describe('when an integer property changes to a number in the table', () => {
    let mount: TableMount;
    const changes: JsonSchema[] = [];

    beforeEach(async () => {
        changes.length = 0;
        mount = new TableMount();
        await chooseNumber(mount, integerSchema, changes);
    });

    afterEach(() => mount.unmount());

    it('should keep the number constraints', () => expect(sample(changes).minimum).to.equal(1));
    it('should drop multipleOf', () => expect(sample(changes)).to.not.have.property('multipleOf'));
    it('should drop default', () => expect(sample(changes)).to.not.have.property('default'));
    it('should keep the annotations', () => expect(sample(changes).description).to.equal('Shown to people'));
});

describe('when a property changes to another type in the table', () => {
    let mount: TableMount;
    const changes: JsonSchema[] = [];

    beforeEach(async () => {
        changes.length = 0;
        mount = new TableMount();
        await chooseNumber(mount, schema, changes);
    });

    afterEach(() => mount.unmount());

    it('should write the new type', () => expect(sample(changes).type).to.equal('number'));
    it('should drop minLength', () => expect(sample(changes)).to.not.have.property('minLength'));
    it('should drop pattern', () => expect(sample(changes)).to.not.have.property('pattern'));
    it('should drop enum', () => expect(sample(changes)).to.not.have.property('enum'));
    it('should drop default', () => expect(sample(changes)).to.not.have.property('default'));
    it('should keep the annotations', () => expect(sample(changes).description).to.equal('Shown to people'));
    it('should keep the vendor keywords', () => expect(sample(changes)['x-sample']).to.deep.equal([1]));
});
