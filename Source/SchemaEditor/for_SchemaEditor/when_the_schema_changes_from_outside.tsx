// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { useState } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { Property } from '../Property';
import type { JsonSchema } from '../../types/JsonSchema';
import { Mount } from './Mount';

const first: JsonSchema = { type: 'object', properties: { alpha: { type: 'string' } } };
const second: JsonSchema = { type: 'object', properties: { beta: { type: 'number' } } };

describe('when the schema is replaced from outside', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor schema={first} />);
        await mount.render(<SchemaEditor schema={second} />);
    });
    afterEach(() => mount.teardown());

    it('should show the new schema', () => {
        expect(mount.names()).to.deep.equal(['beta']);
    });
});

describe('when the host passes back the schema the editor reported', () => {
    const mount = new Mount();
    const trees: Property[][] = [];
    beforeEach(async () => {
        mount.setup();
        trees.length = 0;
        const Host = () => {
            const [schema, setSchema] = useState(first);
            return <SchemaEditor schema={schema} allowKeyProperty onChange={setSchema} onPropertiesChange={tree => trees.push(tree)} />;
        };
        await mount.render(<Host />);
        await mount.click(mount.control('alpha', 'key'));
        await mount.click(mount.control('alpha', 'remove'));
    });
    afterEach(() => mount.teardown());

    it('should keep editing the same tree instead of starting again', () => {
        expect(mount.names()).to.deep.equal([]);
        expect(trees).to.have.length(2);
    });
});

describe('when the host passes an equal schema again on every render', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        const Host = () => <SchemaEditor schema={{ type: 'object', properties: { alpha: { type: 'string' } } }} allowKeyProperty />;
        await mount.render(<Host />);
        await mount.click(mount.control('alpha', 'key'));
        await mount.render(<Host />);
    });
    afterEach(() => mount.teardown());

    it('should keep the edit that was made', () => {
        expect(mount.control('alpha', 'key').getAttribute('aria-pressed')).to.equal('true');
    });
});
