// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { JsonSchema } from '../../types/JsonSchema';
import { Mount } from './Mount';

const schema: JsonSchema = {
    type: 'object',
    properties: {
        orderId: { type: 'string' },
        customer: { type: 'string' },
        lines: { type: 'array', items: { type: 'object', properties: { sku: { type: 'string' } } } as JsonSchema },
    },
};

const written = (schemas: JsonSchema[]) => schemas[schemas.length - 1].properties as Record<string, Record<string, unknown>>;

describe('when the key is allowed', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        await mount.render(<SchemaEditor schema={schema} allowKeyProperty onChange={next => schemas.push(next)} />);
    });
    afterEach(() => mount.teardown());

    it('should offer the toggle on every property', () => {
        expect(mount.parts('key')).to.have.length(4);
    });

    it('should write x-key on the property chosen', async () => {
        await mount.click(mount.control('orderId', 'key'));
        expect(written(schemas).orderId['x-key']).to.equal(true);
    });

    it('should move the key when another property is chosen', async () => {
        await mount.click(mount.control('orderId', 'key'));
        await mount.click(mount.control('customer', 'key'));
        expect(written(schemas).orderId['x-key']).to.equal(undefined);
        expect(written(schemas).customer['x-key']).to.equal(true);
    });

    it('should clear the key when the current key is chosen again', async () => {
        await mount.click(mount.control('orderId', 'key'));
        await mount.click(mount.control('orderId', 'key'));
        expect(written(schemas).orderId['x-key']).to.equal(undefined);
    });

    it('should say the key is pressed once it is chosen', async () => {
        await mount.click(mount.control('orderId', 'key'));
        expect(mount.control('orderId', 'key').getAttribute('aria-pressed')).to.equal('true');
    });
});

describe('when the key is only allowed below the root', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor schema={schema} allowKeyProperty={(_property, context) => context.depth > 0} />);
    });
    afterEach(() => mount.teardown());

    it('should offer the toggle on nested properties only', () => {
        expect(mount.parts('key')).to.have.length(1);
        expect(mount.control('sku', 'key')).to.not.equal(undefined);
    });
});

describe('when required is allowed', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        await mount.render(<SchemaEditor schema={schema} allowRequired onChange={next => schemas.push(next)} />);
    });
    afterEach(() => mount.teardown());

    it('should list the property in required when ticked', async () => {
        await mount.click(mount.control('customer', 'required').querySelector('input')!);
        expect(schemas[schemas.length - 1].required).to.deep.equal(['customer']);
    });

    it('should list a nested property in the required list of its own object', async () => {
        await mount.click(mount.control('sku', 'required').querySelector('input')!);
        const lines = written(schemas).lines as unknown as { items: JsonSchema };
        expect(lines.items.required).to.deep.equal(['sku']);
        expect(schemas[schemas.length - 1].required).to.equal(undefined);
    });

    it('should drop the required list again when unticked', async () => {
        const input = () => mount.control('customer', 'required').querySelector('input')!;
        await mount.click(input());
        await mount.click(input());
        expect(schemas[schemas.length - 1].required).to.equal(undefined);
    });
});
