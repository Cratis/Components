// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { useState } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../../SchemaEditor';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import type { JsonSchema } from '../../../types/JsonSchema';
import { Mount } from './Mount';

const schema = {
    type: 'object', title: 'Example schema', 'x-root': { sample: true }, definitions: { Example: { type: 'string' } },
    properties: { sample: { type: 'string', 'x-sample': [1, 2] }, nested: { type: 'object', properties: { child: { type: 'number' } } } },
} as unknown as JsonSchema;

for (const options of [
    { name: 'not enabled', props: {}, count: 0 },
    { name: 'enabled', props: { allowGeneratedProperty: true }, count: 3 },
    { name: 'enabled only below the root', props: { allowGeneratedProperty: (_property: Property, context: { depth: number }) => context.depth > 0 }, count: 1 },
    { name: 'read only', props: { allowGeneratedProperty: true, readOnly: true }, count: 0 },
]) {
    describe(`when Generated is ${options.name}`, () => {
        const mount = new Mount();
        beforeEach(async () => {
            mount.setup();
            await mount.render(<SchemaEditor layout='tree' schema={schema} {...options.props} />);
        });
        afterEach(() => mount.teardown());
        it('should offer the allowed generated toggles only', () => mount.parts('generated').should.have.length(options.count));
    });
}

describe('when toggling Generated in an editor-owned tree', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    let trees: Property[][];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        trees = [];
        const Host = () => {
            const [value, setValue] = useState(schema);
            return <SchemaEditor layout='tree' schema={value} allowGeneratedProperty onChange={next => { schemas.push(next); setValue(next); }} onPropertiesChange={next => trees.push(next)} />;
        };
        await mount.render(<Host />);
        await mount.click(mount.control('sample', 'generated'));
    });
    afterEach(() => mount.teardown());
    it('should write true alongside other vendor keywords', () => schemas[0].properties!.sample.should.deep.equal({ type: 'string', 'x-sample': [1, 2], 'x-generated': true }));
    it('should preserve root metadata', () => schemas[0].should.deep.equal({ ...schema, properties: { ...schema.properties, sample: { type: 'string', 'x-sample': [1, 2], 'x-generated': true } } }));
    it('should expose the pressed state and tooltip', () => {
        mount.control('sample', 'generated').getAttribute('aria-pressed')!.should.equal('true');
        mount.control('sample', 'generated').title.should.equal('Generated');
    });
    it('should clear the flag without losing metadata or replacing ids', async () => {
        await mount.click(mount.control('sample', 'generated'));
        schemas[1].should.deep.equal(schema);
        trees[0][0].id.should.equal(trees[1][0].id);
    });
});

for (const isGenerated of [true, false]) {
    describe(`when the host owns a property with Generated ${isGenerated}`, () => {
        const mount = new Mount();
        let calls: [string, boolean][];
        beforeEach(async () => {
            mount.setup();
            calls = [];
            await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String, isGenerated }]} onSetGeneratedProperty={(id, value) => calls.push([id, value])} />);
            await mount.click(mount.control('sample', 'generated'));
        });
        afterEach(() => mount.teardown());
        it('should offer the inverse value to the host without changing the property', () => {
            calls.should.deep.equal([['sample-id', !isGenerated]]);
            mount.control('sample', 'generated').getAttribute('aria-pressed')!.should.equal(String(isGenerated));
        });
        it('should honor an explicit false allowance despite the callback', async () => {
            await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String }]} allowGeneratedProperty={false} onSetGeneratedProperty={() => undefined} />);
            mount.parts('generated').should.have.length(0);
        });
    });
}

describe('when adapting the Generated toggle', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} allowGeneratedProperty pt={{ generated: { className: 'example-generated' } }} labels={{ generatedProperty: name => `Create ${name}`, setAsGenerated: 'Create automatically' }} />);
    });
    afterEach(() => mount.teardown());
    it('should honor labels and part attributes', () => {
        const button = mount.control('sample', 'generated');
        button.getAttribute('aria-label')!.should.equal('Create sample');
        button.title.should.equal('Create automatically');
        button.classList.contains('example-generated').should.equal(true);
    });
});
