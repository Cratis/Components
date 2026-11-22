// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { an_editor } from './given/an_editor';

const schema = {
    properties: {
        name: { type: 'string', description: 'An example description' },
        count: { type: 'number' },
        enabled: { type: 'boolean' },
        missing: { type: 'string' },
        empty: { type: 'null' },
        untyped: {},
    },
};

describe('when displaying ObjectContentEditor values in read-only mode', () => {
    let editor: an_editor;
    const onChange = vi.fn();
    const onValidationChange = vi.fn();
    const timestamp = new Date('2026-01-02T03:04:05Z');

    beforeEach(async () => {
        editor = new an_editor();
        onChange.mockClear();
        onValidationChange.mockClear();
        await editor.render({
            object: { name: 'Sample User', count: 0, enabled: false, empty: null, untyped: 'Text', extra: 'Hidden' },
            schema,
            timestamp,
            className: 'example-editor',
            onChange,
            onValidationChange,
        });
    });

    afterEach(async () => editor.dispose());

    it('should display only schema properties in schema order', () => {
        editor.labels().should.deep.equal(['name', 'count', 'enabled', 'missing', 'empty', 'untyped']);
    });

    it('should stringify primitives and leave missing and null values blank', () => {
        const values = Array.from(editor.container.querySelectorAll('tbody tr td:last-child'))
            .map((cell) => cell.textContent);
        values.should.deep.equal(['Sample User', '0', 'false', '', '', 'Text']);
    });

    it('should retain the root styling and component marker', () => {
        editor.find('[data-cratis-component="ObjectContentEditor"]').className
            .should.equal('order-content example-editor');
    });

    it('should display the property description affordance', () => {
        editor.find('button[aria-label="Property description"] .property-info-icon')
            .getAttribute('aria-hidden')!.should.equal('true');
    });

    it('should display the localized snapshot timestamp', () => {
        editor.container.textContent!.should.contain(`Snapshot captured: ${timestamp.toLocaleString()}`);
    });

    it('should not render editable controls or notify changes or validation', () => {
        editor.container.querySelectorAll('input, textarea').length.should.equal(0);
        onChange.mock.calls.should.have.lengthOf(0);
        onValidationChange.mock.calls.should.have.lengthOf(0);
    });
});

describe('when displaying an empty ObjectContentEditor root', () => {
    let editor: an_editor;

    beforeEach(() => { editor = new an_editor(); });
    afterEach(async () => editor.dispose());

    it('should omit the table for a null root', async () => {
        await editor.render({ object: null, schema: {} });
        editor.container.querySelectorAll('table').length.should.equal(0);
    });

    it('should render an empty table without schema properties', async () => {
        await editor.render({ object: { name: 'Sample User' }, schema: {} });
        editor.find('table').querySelectorAll('tr').length.should.equal(0);
    });
});
