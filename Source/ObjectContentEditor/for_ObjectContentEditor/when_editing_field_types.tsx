// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { an_editor } from './given/an_editor';

const object = {
    text: 'Short', long: 'a'.repeat(51), boundary: 'b'.repeat(50), quantity: 3,
    enabled: true, nested: { text: 'Nested' }, list: ['Item'], untyped: 'Read only',
};
const schema = {
    properties: {
        text: { type: 'string' }, long: { type: 'string' }, boundary: { type: 'string' },
        quantity: { type: 'number' }, enabled: { type: 'boolean' }, nested: { type: 'object' },
        list: { type: 'array' }, untyped: {},
    },
};

describe('when editing ObjectContentEditor field types', () => {
    let editor: an_editor;
    const onChange = vi.fn();

    beforeEach(async () => {
        editor = new an_editor();
        onChange.mockClear();
        await editor.render({ object, schema, editMode: true, onChange });
    });
    afterEach(async () => editor.dispose());

    it('should choose the existing input types and long-text boundary', () => {
        editor.find('input[aria-label="text"]').getAttribute('value')!.should.equal('Short');
        editor.find<HTMLTextAreaElement>('textarea[aria-label="long"]').rows.should.equal(3);
        editor.find('input[aria-label="boundary"]').getAttribute('value')!.should.equal(object.boundary);
        editor.find('input[aria-label="quantity"]').getAttribute('type')!.should.equal('number');
        editor.find<HTMLInputElement>('input[aria-label="enabled"]').checked.should.equal(true);
    });

    it('should keep complex fields unsupported and untyped schema fields read-only', () => {
        editor.container.textContent!.should.contain('Array editing not yet supported');
        editor.container.textContent!.should.contain('Object editing not yet supported');
        editor.container.textContent!.should.contain('Read only');
        editor.container.querySelectorAll('[aria-label="untyped"]').length.should.equal(0);
    });

    it('should emit long-text changes with native user metadata', async () => {
        await editor.setValue('long', 'Updated');
        onChange.mock.calls[0][0].should.deep.equal({ ...object, long: 'Updated' });
        onChange.mock.calls[0][1].source.should.equal('user');
        (onChange.mock.calls[0][1].nativeEvent instanceof Event).should.equal(true);
    });

    it('should keep controlled fields unchanged until the parent supplies the new object', async () => {
        await editor.setValue('text', 'Updated');
        editor.find<HTMLInputElement>('[aria-label="text"]').value.should.equal('Short');
        await editor.render({ object: { ...object, text: 'Updated' }, schema, editMode: true, onChange });
        editor.find<HTMLInputElement>('[aria-label="text"]').value.should.equal('Updated');
    });

    it('should only toggle the requested property in a replacement object', async () => {
        await editor.click('[aria-label="enabled"]');
        onChange.mock.calls[0][0].should.deep.equal({ ...object, enabled: false });
        object.enabled.should.equal(true);
    });
});
