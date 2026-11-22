// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { an_editor } from './given/an_editor';

const object = {
    details: { name: 'Example Project', nested: { count: 2 } },
    values: ['Sample', 0, false, null, ['Nested']],
    records: [{ name: 'First', details: {} }, { name: 'Second', details: {}, extra: 'Hidden' }],
    empty: [],
};
const schema = {
    properties: {
        details: { type: 'object' },
        values: { type: 'array' },
        records: { type: 'array' },
        empty: { type: 'array' },
    },
};

describe('when navigating ObjectContentEditor values', () => {
    let editor: an_editor;

    beforeEach(async () => {
        editor = new an_editor();
        await editor.render({ object, schema });
    });
    afterEach(async () => editor.dispose());

    it('should show data properties rather than root schema properties in a nested object', async () => {
        await editor.click('[aria-label="Open details"]');
        editor.labels().should.deep.equal(['name', 'nested']);
        await editor.click('[aria-label="Open nested"]');
        editor.labels().should.deep.equal(['count']);
        await editor.click('[aria-label="Navigate back"]');
        editor.labels().should.deep.equal(['name', 'nested']);
    });

    it('should return to the root using its breadcrumb', async () => {
        await editor.click('[aria-label="Open details"]');
        const rootBreadcrumb = Array.from(editor.container.querySelectorAll<HTMLButtonElement>('button'))
            .find((button) => button.textContent === 'Root');
        if (!rootBreadcrumb) throw new Error('Root breadcrumb was not rendered.');
        await act(async () => rootBreadcrumb.click());
        editor.labels().should.deep.equal(['details', 'values', 'records', 'empty']);
    });

    it('should display primitive array items by index and allow nested array navigation', async () => {
        await editor.click('[aria-label="Open values, 5 items"]');
        editor.labels().should.deep.equal(['[0]', '[1]', '[2]', '[3]', '[4]']);
        const values = Array.from(editor.container.querySelectorAll('tbody tr td:last-child'))
            .map((cell) => cell.textContent);
        values.should.deep.equal(['Sample', '0', 'false', '', 'Array[1]']);
        await editor.click('[aria-label="Open [4], 1 items"]');
        editor.find('tbody').textContent!.should.equal('[0]Nested');
    });

    it('should display object arrays using the first item keys with separators', async () => {
        await editor.click('[aria-label="Open records, 2 items"]');
        editor.labels().should.deep.equal(['name', 'details', '', 'name', 'details']);
        editor.find('td[colspan="2"]').parentElement!.style.height.should.equal('8px');
        editor.container.textContent!.should.not.contain('Hidden');
    });

    it('should display the empty array message without a table', async () => {
        await editor.click('[aria-label="Open empty, 0 items"]');
        editor.container.textContent!.should.contain('Empty array');
        editor.container.querySelectorAll('table').length.should.equal(0);
    });

    it('should reset navigation if the current value is replaced by a primitive', async () => {
        await editor.click('[aria-label="Open details"]');
        await editor.render({ object: { ...object, details: 'Replaced' }, schema });
        editor.labels().should.deep.equal(['details', 'values', 'records', 'empty']);
        editor.find<HTMLButtonElement>('[aria-label="Navigate back"]').disabled.should.equal(true);
    });

    it('should retain navigation when the current object is replaced by another object', async () => {
        await editor.click('[aria-label="Open details"]');
        await editor.render({ object: { ...object, details: { replacement: true } }, schema });
        editor.labels().should.deep.equal(['replacement']);
    });

    it('should keep a nested object read-only after switching into edit mode', async () => {
        await editor.click('[aria-label="Open details"]');
        await editor.render({ object, schema, editMode: true });
        editor.container.querySelectorAll('input, textarea').length.should.equal(0);
        editor.labels().should.deep.equal(['name', 'nested']);
    });
});
