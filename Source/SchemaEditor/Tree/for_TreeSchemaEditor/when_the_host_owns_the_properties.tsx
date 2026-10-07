// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { SchemaEditor } from '../../SchemaEditor';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { Mount } from './Mount';

const properties = (): Property[] => [
    { id: 'one', name: 'first', type: PropertyType.String },
    { id: 'two', name: 'second', type: PropertyType.Object, children: [] },
];

describe('when the host owns the properties', () => {
    const mount = new Mount();
    // The root's add button follows the whole tree, so it is the last one in the document.
    const rootAdd = () => mount.parts('add')[mount.parts('add').length - 1];
    let calls: string[];
    beforeEach(async () => {
        mount.setup();
        calls = [];
        await mount.render(
            <SchemaEditor
                layout='tree'
                properties={properties()}
                allowRequired
                allowKeyProperty
                onAddProperty={(type, concept) => calls.push(`add ${type} ${concept ?? ''}`.trim())}
                onAddChildProperty={(parentId, type) => calls.push(`child ${parentId} ${type}`)}
                onDeleteProperty={propertyId => calls.push(`delete ${propertyId}`)}
                onRenameProperty={(propertyId, name) => calls.push(`rename ${propertyId} ${name}`)}
                onChangePropertyType={(propertyId, type) => calls.push(`type ${propertyId} ${type}`)}
                onSetKeyProperty={propertyId => calls.push(`key ${propertyId}`)}
                onSetRequiredProperty={(propertyId, isRequired) => calls.push(`required ${propertyId} ${isRequired}`)} />);
    });
    afterEach(() => mount.teardown());

    it('should report adding to the root without changing what is shown', async () => {
        await mount.openMenu(rootAdd());
        await mount.choose('Number');
        expect(calls).to.deep.equal(['add number']);
        expect(mount.names()).to.deep.equal(['first', 'second']);
    });

    it('should report adding to a nested object', async () => {
        await mount.openMenu(rootAdd());
        await mount.choose('Yes or no');
        await mount.openMenu(mount.parts('add')[0]);
        await mount.choose('Text');
        expect(calls).to.deep.equal(['add boolean', 'child two string']);
    });

    it('should report deleting, changing the type, the key and required', async () => {
        await mount.click(mount.control('first', 'remove'));
        await mount.openMenu(mount.control('first', 'typeButton'));
        await mount.choose('Date');
        await mount.click(mount.control('first', 'key'));
        await mount.click(mount.control('first', 'required').querySelector('input')!);
        expect(calls).to.deep.equal(['delete one', 'type one date', 'key one', 'required one true']);
    });

    it('should report a rename once the name is checked', async () => {
        await mount.doubleClick(mount.control('first', 'name'));
        const input = document.querySelector<HTMLInputElement>('[data-cratis-part="nameInput"]')!;
        await mount.type(input, 'renamed');
        await mount.key(input, 'Enter');
        expect(calls).to.deep.equal(['rename one renamed']);
    });
});

describe('when the host leaves an edit out', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(<SchemaEditor layout='tree' properties={properties()} onDeleteProperty={() => undefined} />);
    });
    afterEach(() => mount.teardown());

    it('should not offer it', () => {
        expect(mount.parts('add')).to.have.length(0);
        expect(mount.parts('typeButton')).to.have.length(0);
    });

    it('should still offer the edits that have a callback', () => {
        expect(mount.parts('remove')).to.have.length(2);
    });
});

describe('when the editor is read-only', () => {
    const mount = new Mount();
    beforeEach(async () => {
        mount.setup();
        await mount.render(
            <SchemaEditor
                layout='tree'
                schema={{ type: 'object', properties: { name: { type: 'string' } } }}
                readOnly
                allowKeyProperty
                allowRequired
                renderPropertyAccessory={(_property, context) => <span>{context.readOnly ? 'locked' : 'open'}</span>} />);
    });
    afterEach(() => mount.teardown());

    it('should offer no edits', () => {
        for (const part of ['add', 'remove', 'typeButton', 'key']) {
            expect(mount.parts(part), part).to.have.length(0);
        }
    });

    it('should show the required toggle disabled', () => {
        expect(mount.control('name', 'required').querySelector('input')!.disabled).to.equal(true);
    });

    it('should tell the slots, and mark the root', () => {
        expect(mount.control('name', 'accessory').textContent).to.equal('locked');
        expect(mount.parts('root')[0].hasAttribute('data-readonly')).to.equal(true);
    });
});
