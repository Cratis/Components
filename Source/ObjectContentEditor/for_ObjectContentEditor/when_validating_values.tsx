// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { an_editor } from './given/an_editor';

const schema = {
    properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        website: { type: 'string', format: 'uri' },
        quantity: { type: 'integer' },
        enabled: { type: 'boolean' },
        absent: { type: 'string' },
    },
};
const object = { name: '', email: 'invalid', website: 'ftp://example.invalid', quantity: 0, enabled: false };

describe('when validating ObjectContentEditor values', () => {
    let editor: an_editor;
    const onValidationChange = vi.fn();
    const onChange = vi.fn();

    beforeEach(async () => {
        editor = new an_editor();
        onChange.mockClear();
        onValidationChange.mockClear();
        await editor.render({ object, schema, editMode: true, onChange, onValidationChange });
    });
    afterEach(async () => editor.dispose());

    it('should require every editable field even without a required schema annotation', () => {
        editor.find('[aria-label="name"]').getAttribute('aria-invalid')!.should.equal('true');
        editor.find('[aria-label="absent"]').parentElement!.textContent!.should.equal('This field is required');
    });

    it('should report initial validation after the initial no-error notification', () => {
        onValidationChange.mock.calls.should.deep.equal([[false], [true]]);
    });

    it('should retain email and URI validation messages', () => {
        editor.find('[aria-label="email"]').parentElement!.textContent!.should.equal('Invalid email format');
        editor.find('[aria-label="website"]').parentElement!.textContent!.should.equal('Invalid URI format');
    });

    it('should accept zero and false without marking them invalid', () => {
        editor.find('[aria-label="quantity"]').hasAttribute('aria-invalid').should.equal(false);
        editor.find('[aria-label="enabled"]').hasAttribute('aria-invalid').should.equal(false);
    });

    it('should clear field errors as their values become valid', async () => {
        await editor.setValue('name', 'Sample User');
        await editor.setValue('absent', 'Added');
        await editor.setValue('email', 'sample@example.invalid');
        await editor.setValue('website', 'https://example.invalid');
        onValidationChange.mock.lastCall!.should.deep.equal([false]);
        editor.container.querySelectorAll('small').length.should.equal(0);
    });

    it('should emit the updated object before updating validation errors', async () => {
        const invalidAtChange: boolean[] = [];
        await editor.render({ object, schema, editMode: true, onChange: () => {
            invalidAtChange.push(editor.find('[aria-label="email"]').hasAttribute('aria-invalid'));
        } });
        await editor.setValue('email', 'sample@example.invalid');
        invalidAtChange.should.deep.equal([true]);
        editor.find('[aria-label="email"]').hasAttribute('aria-invalid').should.equal(false);
    });

    it('should add a missing property without mutating or removing existing properties', async () => {
        await editor.setValue('absent', 'Added');
        onChange.mock.calls[0][0].should.deep.equal({ ...object, absent: 'Added' });
        Object.keys(object).should.not.contain('absent');
    });

    it('should emit null and a required error when clearing a number', async () => {
        await editor.setValue('quantity', '');
        (onChange.mock.calls[0][0].quantity === null).should.equal(true);
        editor.find('[aria-label="quantity"]').parentElement!.textContent!.should.equal('This field is required');
    });

    it('should still update local validation without an onChange handler', async () => {
        await editor.render({ object, schema, editMode: true });
        await editor.setValue('email', 'sample@example.invalid');
        editor.find('[aria-label="email"]').hasAttribute('aria-invalid').should.equal(false);
        onChange.mock.calls.should.have.lengthOf(0);
    });

    it('should revalidate when the controlled object changes', async () => {
        await editor.render({
            object: { name: 'Sample User', email: 'sample@example.invalid', website: 'http://example.invalid', quantity: 1, enabled: true, absent: 'Present' },
            schema,
            editMode: true,
            onValidationChange,
        });
        onValidationChange.mock.lastCall!.should.deep.equal([false]);
    });
});

describe('when validating a nonnumeric ObjectContentEditor value', () => {
    let editor: an_editor;
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        editor = new an_editor();
        consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        await editor.render({ object: { quantity: 'invalid' }, schema: { properties: { quantity: { type: 'number' } } }, editMode: true });
    });
    afterEach(async () => {
        await editor.dispose();
        consoleError.mockRestore();
    });

    it('should retain the numeric validation message', () => {
        editor.find('[aria-label="quantity"]').parentElement!.textContent!.should.equal('Must be a valid number');
    });

});
