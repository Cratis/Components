// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../SchemaEditor';
import type { Property } from '../Tree/Property';
import type { JsonSchema } from '../../types/JsonSchema';
import { TableMount } from './TableMount';

const schema = (): JsonSchema => ({
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' } },
});

describe('when a host protects a property in the table', () => {
    let mount: TableMount;

    beforeEach(async () => {
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={schema()} editMode isPropertyProtected={property => property.name === 'id'} />);
    });

    afterEach(() => mount.unmount());

    it('should lock its name', () => {
        const inputs = mount.container.querySelectorAll<HTMLInputElement>('input[aria-label="Property name"]');
        expect(inputs[0].disabled).to.equal(true);
        expect(inputs[1].disabled).to.equal(false);
    });

    it('should not offer to delete it', () =>
        expect(mount.container.querySelectorAll('button[aria-label="Delete property"]')).to.have.lengthOf(1));
});

describe('when a host validates names in the table', () => {
    let mount: TableMount;

    beforeEach(async () => {
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={schema()} editMode validatePropertyName={name => name === 'name' ? 'Taken by the host' : undefined} />);
    });

    afterEach(() => mount.unmount());

    it('should mark the name invalid and block Save', () => {
        const inputs = mount.container.querySelectorAll<HTMLInputElement>('input[aria-label="Property name"]');
        expect(inputs[1].getAttribute('aria-invalid')).to.equal('true');
        expect(inputs[0].getAttribute('aria-invalid')).to.equal(null);
        expect(mount.container.querySelector('[role="menuitem"][aria-disabled="true"], button[disabled]')).to.not.equal(null);
    });
});

describe('when a host follows renames and removals in the table', () => {
    let mount: TableMount;
    const renamed: [string, string][] = [];
    const removed: string[] = [];

    beforeEach(async () => {
        renamed.length = 0;
        removed.length = 0;
        mount = new TableMount();
        await mount.render(
            <SchemaEditor
                schema={schema()}
                editMode
                onPropertyRenamed={(property: Property, previousName) => renamed.push([property.name, previousName])}
                onPropertyRemoved={property => removed.push(property.name)}
            />,
        );
    });

    afterEach(() => mount.unmount());

    it('should report the rename with the previous name', async () => {
        await mount.type(mount.container.querySelectorAll<HTMLInputElement>('input[aria-label="Property name"]')[1], 'title');
        expect(renamed).to.deep.equal([['title', 'name']]);
    });

    it('should report the removed property', async () => {
        await mount.click(mount.container.querySelectorAll('button[aria-label="Delete property"]')[0]);
        expect(removed).to.deep.equal(['id']);
    });
});

describe('when a host adds header and footer content to the table', () => {
    let mount: TableMount;

    beforeEach(async () => {
        mount = new TableMount();
        await mount.render(<SchemaEditor schema={schema()} header={<p data-testid='header'>Header</p>} footer={<p data-testid='footer'>Footer</p>} />);
    });

    afterEach(() => mount.unmount());

    it('should render the header before and the footer after the editor', () => {
        const root = mount.container.querySelector('.schema-editor')!;
        expect(root.firstElementChild?.getAttribute('data-testid')).to.equal('header');
        expect(root.lastElementChild?.getAttribute('data-testid')).to.equal('footer');
    });
});
