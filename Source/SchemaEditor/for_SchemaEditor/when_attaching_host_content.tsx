// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { Property } from '../Property';
import type { SchemaPropertyContext } from '../SchemaPropertyContext';
import type { JsonSchema } from '../../types/JsonSchema';
import { Mount } from './Mount';

const schema: JsonSchema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        address: { type: 'object', properties: { city: { type: 'string' } } },
    },
};

describe('when the host supplies slots', () => {
    const mount = new Mount();
    const leading: Array<[string, number]> = [];
    let contexts: SchemaPropertyContext[];
    beforeEach(async () => {
        mount.setup();
        leading.length = 0;
        contexts = [];
        await mount.render(
            <SchemaEditor
                schema={schema}
                header={<h2>Order</h2>}
                footer={<button type='button'>Extra</button>}
                renderPropertyLeading={(property: Property, context) => { leading.push([property.name, context.depth]); return <i data-testid='dot' />; }}
                renderPropertyAccessory={(property, context) => { contexts.push(context); return <button type='button'>{`Rules for ${property.name}`}</button>; }}
                renderPropertyDetails={property => property.name === 'name' ? <p>Must not be empty</p> : undefined} />);
    });
    afterEach(() => mount.teardown());

    it('should render the header above the properties', () => {
        expect(mount.parts('header')[0].textContent).to.equal('Order');
    });

    it('should render the footer beside the add button', () => {
        expect(mount.parts('footer')[0].textContent).to.equal('Extra');
    });

    it('should render the leading slot at the start of every row, with the depth', () => {
        expect(leading).to.deep.include(['name', 0]);
        expect(leading).to.deep.include(['city', 1]);
        expect(mount.parts('leading')).to.have.length(3);
    });

    it('should render the accessory slot in each row', () => {
        expect(mount.control('city', 'accessory').textContent).to.equal('Rules for city');
    });

    it('should give the slots the whole tree and the siblings of the row', () => {
        const context = contexts.find(candidate => candidate.depth === 1)!;
        expect(context.properties.map(property => property.name)).to.deep.equal(['name', 'address']);
        expect(context.siblings.map(property => property.name)).to.deep.equal(['city']);
        expect(context.readOnly).to.equal(false);
    });

    it('should render details under the row they belong to and nowhere else', () => {
        expect(mount.parts('details')).to.have.length(1);
        expect(mount.parts('details')[0].textContent).to.equal('Must not be empty');
    });
});

describe('when the host describes a row', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(
            <SchemaEditor
                schema={schema}
                selectedPropertyId={null}
                getPropertyRowState={property => property.name === 'name'
                    ? { className: 'mapped', title: 'Mapped', attributes: { 'data-drop-target': 'name' }, lockType: true }
                    : undefined} />);
    });
    afterEach(() => mount.teardown());

    it('should add its class name, tooltip and attributes to the row', () => {
        const row = mount.row('name');
        expect(row.classList.contains('mapped')).to.equal(true);
        expect(row.getAttribute('title')).to.equal('Mapped');
        expect(row.getAttribute('data-drop-target')).to.equal('name');
    });

    it('should lock the type so that the badge is no longer a button', () => {
        expect(mount.row('name').querySelector('[data-cratis-part="typeButton"]')).to.equal(null);
        expect(mount.row('address').querySelector('[data-cratis-part="typeButton"]')).to.not.equal(null);
    });
});

describe('when rows can be selected', () => {
    const mount = new Mount();
    let clicked: string[];
    beforeEach(async () => {
        mount.setup();
        clicked = [];
        await mount.render(
            <SchemaEditor
                schema={schema}
                onPropertyClick={propertyId => clicked.push(propertyId)} />);
    });
    afterEach(() => mount.teardown());

    it('should report a click on the name', async () => {
        await mount.click(mount.control('name', 'name'));
        expect(clicked).to.have.length(1);
    });

    it('should report a click on the row', async () => {
        await mount.click(mount.row('name'));
        expect(clicked).to.have.length(1);
    });

    it('should not report a click on a control inside the row', async () => {
        await mount.click(mount.control('name', 'remove'));
        expect(clicked).to.have.length(0);
    });
});

describe('when a property is marked selected', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        const properties = [{ id: 'one', name: 'first', type: 'string' }, { id: 'two', name: 'second', type: 'string' }] as Property[];
        await mount.render(<SchemaEditor properties={properties} selectedPropertyId='two' />);
    });
    afterEach(() => mount.teardown());

    it('should mark only that row', () => {
        expect(mount.row('first').hasAttribute('data-selected')).to.equal(false);
        expect(mount.row('second').hasAttribute('data-selected')).to.equal(true);
    });
});
