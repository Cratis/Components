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
        name: { type: 'string' },
        address: { type: 'object', properties: { city: { type: 'string' } } },
    },
};

describe('when rendering a schema', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor schema={schema} />);
    });
    afterEach(() => mount.teardown());

    it('should show every property, nested ones under their parent', () => {
        expect(mount.names()).to.deep.equal(['name', 'address', 'city']);
    });

    it('should name the editor for assistive technology', () => {
        expect(mount.parts('root')[0].getAttribute('aria-label')).to.equal('Schema properties');
    });

    it('should name the list of nested properties after their parent', () => {
        expect(mount.parts('list')[1].getAttribute('aria-label')).to.equal('Properties of address');
    });

    it('should show the type of each property as text', () => {
        expect(mount.control('name', 'badge').textContent).to.contain('Text');
    });

    it('should not offer the key or required toggles until they are asked for', () => {
        expect(mount.parts('key')).to.have.length(0);
        expect(mount.parts('required')).to.have.length(0);
    });
});

describe('when rendering a schema without properties', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor />);
    });
    afterEach(() => mount.teardown());

    it('should say that there are no properties', () => {
        expect(mount.parts('empty')[0].textContent).to.equal('No properties defined');
    });

    it('should still offer adding a property', () => {
        expect(mount.parts('add')).to.have.length(1);
    });
});

describe('when the labels are localized', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor schema={schema} labels={{ noProperties: 'Ingen egenskaper', addProperty: 'Legg til', deleteProperty: name => `Slett ${name}` }} />);
    });
    afterEach(() => mount.teardown());

    it('should use the supplied add label', () => {
        expect(mount.parts('add')[0].textContent).to.equal('Legg til');
    });

    it('should name each remove button with the supplied function', () => {
        expect(mount.control('name', 'remove').getAttribute('aria-label')).to.equal('Slett name');
    });

    it('should keep English for what was not supplied', () => {
        expect(mount.control('name', 'badge').textContent).to.contain('Text');
    });
});
