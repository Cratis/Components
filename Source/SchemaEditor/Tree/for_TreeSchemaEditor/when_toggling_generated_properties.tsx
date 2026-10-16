// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

describe('when Generated is not enabled', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} />);
    });
    afterEach(() => mount.teardown());
    it('should not offer generated toggles', () => mount.parts('generated').should.have.length(0));
});

describe('when Generated is enabled', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} allowGeneratedProperty />);
    });
    afterEach(() => mount.teardown());
    it('should offer a generated toggle for each property', () => mount.parts('generated').should.have.length(3));
});

describe('when Generated is enabled only below the root', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} allowGeneratedProperty={(_property, context) => context.depth > 0} />);
    });
    afterEach(() => mount.teardown());
    it('should offer the allowed generated toggle only', () => mount.parts('generated').should.have.length(1));
});

describe('when Generated is read only', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} allowGeneratedProperty readOnly />);
    });
    afterEach(() => mount.teardown());
    it('should not offer generated toggles', () => mount.parts('generated').should.have.length(0));
});

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
    it('should report properties that compare equal to plain host literals', () => {
        expect(trees[1]).toEqual([
            { id: expect.any(String), name: 'sample', type: PropertyType.String, vendorKeywords: { 'x-sample': [1, 2] } },
            {
                id: expect.any(String), name: 'nested', type: PropertyType.Object,
                children: [{ id: expect.any(String), name: 'child', type: PropertyType.Number }],
            },
        ]);
    });
});

describe('when clearing Generated on a host-owned property', () => {
    const mount = new Mount();
    let calls: [string, boolean][];
    beforeEach(async () => {
        mount.setup();
        calls = [];
        await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String, isGenerated: true }]} onSetGeneratedProperty={(id, value) => calls.push([id, value])} />);
        await mount.click(mount.control('sample', 'generated'));
    });
    afterEach(() => mount.teardown());
    it('should ask the host to clear the flag', () => calls.should.deep.equal([['sample-id', false]]));
    it('should leave the property unchanged', () => mount.control('sample', 'generated').getAttribute('aria-pressed')!.should.equal('true'));
});

describe('when marking Generated on a host-owned property', () => {
    const mount = new Mount();
    let calls: [string, boolean][];
    beforeEach(async () => {
        mount.setup();
        calls = [];
        await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String, isGenerated: false }]} onSetGeneratedProperty={(id, value) => calls.push([id, value])} />);
        await mount.click(mount.control('sample', 'generated'));
    });
    afterEach(() => mount.teardown());
    it('should ask the host to set the flag', () => calls.should.deep.equal([['sample-id', true]]));
    it('should leave the property unchanged', () => mount.control('sample', 'generated').getAttribute('aria-pressed')!.should.equal('false'));
});

describe('when a host explicitly hides Generated despite supplying the callback', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String }]} allowGeneratedProperty={false} onSetGeneratedProperty={() => undefined} />);
    });
    afterEach(() => mount.teardown());
    it('should not offer a toggle', () => mount.parts('generated').should.have.length(0));
});

describe('when a generated property is read only', () => {
    const mount = new Mount();
    let calls: [string, boolean][];
    let marker: HTMLElement;
    beforeEach(async () => {
        mount.setup();
        calls = [];
        await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String, isGenerated: true }]} allowGeneratedProperty readOnly onSetGeneratedProperty={(id, value) => calls.push([id, value])} />);
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

describe('when a generated property is rejected by the predicate', () => {
    const mount = new Mount();
    let calls: [string, boolean][];
    let marker: HTMLElement;
    beforeEach(async () => {
        mount.setup();
        calls = [];
        await mount.render(<SchemaEditor layout='tree' properties={[{ id: 'sample-id', name: 'sample', type: PropertyType.String, isGenerated: true }]} allowGeneratedProperty={() => false} onSetGeneratedProperty={(id, value) => calls.push([id, value])} />);
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
