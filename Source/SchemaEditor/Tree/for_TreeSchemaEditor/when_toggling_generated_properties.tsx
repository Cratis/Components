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

const Host = ({ schemas, trees }: { schemas: JsonSchema[]; trees: Property[][] }) => {
    const [value, setValue] = useState(schema);
    return <SchemaEditor layout='tree' schema={value} allowGeneratedProperty onChange={next => { schemas.push(next); setValue(next); }} onPropertiesChange={next => trees.push(next)} />;
};

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

describe('when marking Generated in an editor-owned tree', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    let trees: Property[][];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        trees = [];
        await mount.render(<Host schemas={schemas} trees={trees} />);
        await mount.click(mount.control('sample', 'generated'));
    });
    afterEach(() => mount.teardown());
    it('should write true alongside other vendor keywords', () => schemas[0].properties!.sample.should.deep.equal({ type: 'string', 'x-sample': [1, 2], 'x-generated': true }));
    it('should preserve root metadata', () => schemas[0].should.deep.equal({ ...schema, properties: { ...schema.properties, sample: { type: 'string', 'x-sample': [1, 2], 'x-generated': true } } }));
    it('should expose the pressed state and tooltip', () => {
        mount.control('sample', 'generated').getAttribute('aria-pressed')!.should.equal('true');
        mount.control('sample', 'generated').title.should.equal('The value is generated. Select it again to mark it as entered.');
    });
});

describe('when clearing Generated in an editor-owned tree', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    let trees: Property[][];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        trees = [];
        await mount.render(<Host schemas={schemas} trees={trees} />);
        await mount.click(mount.control('sample', 'generated'));
        await mount.click(mount.control('sample', 'generated'));
    });
    afterEach(() => mount.teardown());
    it('should clear the flag without losing metadata or replacing ids', () => {
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
    });
}

describe('when a host explicitly hides Generated despite supplying the callback', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String }]} allowGeneratedProperty={false} onSetGeneratedProperty={() => undefined} />);
    });
    afterEach(() => mount.teardown());
    it('should not offer a toggle', () => mount.parts('generated').should.have.length(0));
});

for (const options of [
    { name: 'read only', props: { allowGeneratedProperty: true, readOnly: true } },
    { name: 'rejected by the predicate', props: { allowGeneratedProperty: () => false } },
]) {
    describe(`when a generated property's toggle is ${options.name}`, () => {
        const mount = new Mount();
        let calls: [string, boolean][];
        let marker: HTMLElement;
        beforeEach(async () => {
            mount.setup();
            calls = [];
            await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String, isGenerated: true }]} {...options.props} onSetGeneratedProperty={(id, value) => calls.push([id, value])} />);
            marker = mount.control('sample', 'generated');
            await mount.click(marker);
        });
        afterEach(() => mount.teardown());
        it('should expose a pressed non-interactive marker with an accessible name', () => {
            marker.tagName.should.equal('SPAN');
            marker.getAttribute('role')!.should.equal('img');
            marker.getAttribute('data-pressed')!.should.equal('true');
            marker.getAttribute('aria-label')!.should.equal('Generated: sample');
            marker.hasAttribute('tabindex').should.equal(false);
        });
        it('should not offer a generated edit', () => calls.should.have.length(0));
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
