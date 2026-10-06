// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { Property } from '../Property';
import type { JsonSchema } from '../../types/JsonSchema';
import { Mount } from './Mount';

const schema: JsonSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        owner: { type: 'string' },
    },
    required: ['title'],
};

const nameInput = () => document.querySelector<HTMLInputElement>('[data-cratis-part="nameInput"]')!;

describe('when renaming a property', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    let renamed: Array<[string, string]>;
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        renamed = [];
        await mount.render(
            <SchemaEditor
                schema={schema}
                allowRequired
                onChange={next => schemas.push(next)}
                onPropertyRenamed={(property: Property, previousName) => renamed.push([previousName, property.name])} />);
    });
    afterEach(() => mount.teardown());

    const startRenaming = async (name: string) => mount.doubleClick(mount.control(name, 'name'));

    it('should start renaming with a double click', async () => {
        await startRenaming('title');
        expect(nameInput().value).to.equal('title');
    });

    it('should start renaming with F2', async () => {
        await mount.key(mount.control('title', 'name'), 'F2');
        expect(nameInput()).to.not.equal(null);
    });

    it('should write the new name and keep it required when Enter is pressed', async () => {
        await startRenaming('title');
        await mount.type(nameInput(), 'heading');
        await mount.key(nameInput(), 'Enter');
        expect(Object.keys(schemas[0].properties!)).to.deep.equal(['id', 'heading', 'owner']);
        expect(schemas[0].required).to.deep.equal(['heading']);
    });

    it('should tell the host which name the property had', async () => {
        await startRenaming('title');
        await mount.type(nameInput(), 'heading');
        await mount.key(nameInput(), 'Enter');
        expect(renamed).to.deep.equal([['title', 'heading']]);
    });

    it('should reject a name a sibling already uses and say why', async () => {
        await startRenaming('title');
        await mount.type(nameInput(), 'owner');
        await mount.key(nameInput(), 'Enter');
        expect(schemas).to.have.length(0);
        expect(nameInput().getAttribute('aria-invalid')).to.equal('true');
        expect(mount.parts('message')[0].textContent).to.equal('Another property is already named owner.');
    });

    it('should reject a blank name', async () => {
        await startRenaming('title');
        await mount.type(nameInput(), '   ');
        await mount.key(nameInput(), 'Enter');
        expect(mount.parts('message')[0].textContent).to.equal('Enter a name.');
    });

    it('should reject a name that shadows a member every object inherits', async () => {
        await startRenaming('title');
        await mount.type(nameInput(), '__proto__');
        await mount.key(nameInput(), 'Enter');
        expect(schemas).to.have.length(0);
    });

    it('should leave the name alone when Escape is pressed', async () => {
        await startRenaming('title');
        await mount.type(nameInput(), 'heading');
        await mount.key(nameInput(), 'Escape');
        expect(schemas).to.have.length(0);
        expect(mount.names()).to.contain('title');
    });
});

describe('when the host adds a rule to the name check', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        await mount.render(
            <SchemaEditor
                schema={schema}
                onChange={next => schemas.push(next)}
                validatePropertyName={name => /\s/.test(name) ? 'No spaces.' : undefined} />);
        await mount.doubleClick(mount.control('title', 'name'));
        await mount.type(nameInput(), 'two words');
        await mount.key(nameInput(), 'Enter');
    });
    afterEach(() => mount.teardown());

    it('should show the host message', () => {
        expect(mount.parts('message')[0].textContent).to.equal('No spaces.');
    });

    it('should not change the schema', () => {
        expect(schemas).to.have.length(0);
    });
});

describe('when removing a property', () => {
    const mount = new Mount();
    let schemas: JsonSchema[];
    let removed: string[];
    beforeEach(async () => {
        mount.setup();
        schemas = [];
        removed = [];
        await mount.render(
            <SchemaEditor
                schema={schema}
                onChange={next => schemas.push(next)}
                onPropertyRemoved={property => removed.push(property.name)} />);
        await mount.click(mount.control('owner', 'remove'));
    });
    afterEach(() => mount.teardown());

    it('should take the property out of the schema', () => {
        expect(Object.keys(schemas[0].properties!)).to.deep.equal(['id', 'title']);
    });

    it('should tell the host which property went', () => {
        expect(removed).to.deep.equal(['owner']);
    });
});

describe('when some properties are protected', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor schema={schema} isPropertyProtected={property => property.name === 'id'} />);
    });
    afterEach(() => mount.teardown());

    it('should not offer removing a protected property', () => {
        expect(mount.row('id').querySelector('[data-cratis-part="remove"]')).to.equal(null);
    });

    it('should explain why in text', () => {
        expect(mount.control('id', 'protected').getAttribute('aria-label')).to.equal('This property cannot be renamed or removed.');
    });

    it('should not start renaming it', async () => {
        await mount.doubleClick(mount.control('id', 'name'));
        expect(nameInput()).to.equal(null);
    });

    it('should leave the other properties editable', () => {
        expect(mount.control('owner', 'remove')).to.not.equal(undefined);
    });
});
