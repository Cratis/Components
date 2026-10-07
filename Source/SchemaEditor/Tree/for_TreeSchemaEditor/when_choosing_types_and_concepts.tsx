// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../../SchemaEditor';
import { PropertyConceptsProvider } from '../PropertyConceptsContext';
import type { PropertyConcept } from '../PropertyConcept';
import { PropertyType } from '../PropertyType';
import type { JsonSchema } from '../../../types/JsonSchema';
import { Mount } from './Mount';

const schema: JsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
const concepts: PropertyConcept[] = [
    { name: 'OrderNumber', type: PropertyType.Number },
    { name: 'CustomerId', type: PropertyType.String },
];

describe('when opening the menu of types', () => {
    const mount = new Mount();
    let offered: string[];
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} concepts={concepts} />);
        offered = await mount.openMenu(mount.parts('add')[0]);
    });
    afterEach(() => mount.teardown());

    it('should offer the primitives first', () => {
        expect(offered[0].endsWith('Text')).to.equal(true);
        expect(offered[4].endsWith('Time')).to.equal(true);
    });

    it('should list the concepts alphabetically after the primitives', () => {
        const customer = offered.findIndex(label => label.endsWith('CustomerId'));
        const order = offered.findIndex(label => label.endsWith('OrderNumber'));
        const time = offered.findIndex(label => label.endsWith('Time'));
        expect(time).to.be.lessThan(customer);
        expect(customer).to.be.lessThan(order);
    });

    it('should offer the composite types last', () => {
        expect(offered[offered.length - 1].endsWith('List of objects')).to.equal(true);
    });

    it('should name the menu', () => {
        expect(document.querySelector('[role="menu"]')!.getAttribute('aria-label')).to.equal('Property types');
    });
});

describe('when choosing a concept for a new property', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        await mount.render(<SchemaEditor layout='tree' schema={schema} concepts={concepts} onChange={next => schemas.push(next)} />);
        await mount.openMenu(mount.parts('add')[0]);
        await mount.choose('CustomerId');
    });
    afterEach(() => mount.teardown());

    it('should name the property after the concept', () => {
        expect(Object.keys(schemas[0].properties!)).to.deep.equal(['name', 'customerId']);
    });

    it('should write x-concept on the primitive the concept wraps', () => {
        expect(schemas[0].properties!.customerId).to.deep.equal({ type: 'string', 'x-concept': 'CustomerId' });
    });
});

describe('when concepts come from the surrounding provider', () => {
    const mount = new Mount();
    let offered: string[];
    beforeEach(async () => {
        mount.setup();
        await mount.render(<PropertyConceptsProvider concepts={concepts}><SchemaEditor layout='tree' schema={schema} /></PropertyConceptsProvider>);
        offered = await mount.openMenu(mount.parts('add')[0]);
    });
    afterEach(() => mount.teardown());

    it('should offer them', () => {
        expect(offered.some(label => label.endsWith('CustomerId'))).to.equal(true);
    });
});

describe('when changing the type of a property to a concept and back', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        await mount.render(<SchemaEditor layout='tree' schema={schema} concepts={concepts} onChange={next => schemas.push(next)} />);
        await mount.openMenu(mount.control('name', 'typeButton'));
        await mount.choose('CustomerId');
        await mount.openMenu(mount.control('name', 'typeButton'));
        await mount.choose('Number');
    });
    afterEach(() => mount.teardown());

    it('should have carried the concept in between', () => {
        expect(schemas[0].properties!.name).to.deep.equal({ type: 'string', 'x-concept': 'CustomerId' });
    });

    it('should drop the concept when a plain primitive is chosen', () => {
        expect(schemas[1].properties!.name).to.deep.equal({ type: 'number' });
    });
});

describe('when the schema already carries a concept', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={{ type: 'object', properties: { name: { type: 'string', 'x-concept': 'CustomerId' } as never } }} />);
    });
    afterEach(() => mount.teardown());

    it('should show the concept by name in the badge', () => {
        expect(mount.control('name', 'badge').textContent).to.contain('CustomerId');
    });
});

describe('when changing a property to an object', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' schema={schema} />);
        await mount.openMenu(mount.control('name', 'typeButton'));
        await mount.choose('Object');
    });
    afterEach(() => mount.teardown());

    it('should offer adding properties to it', () => {
        expect(mount.parts('add').map(button => button.getAttribute('aria-label'))).to.contain('Add property to name');
    });
});
