// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';
import {
    focusComboBox,
    listbox,
    mountComboBox,
    options,
    pressComboBoxKey,
    typeIntoComboBox,
    type MountedComboBox,
} from './given/a_combobox';

describe('when selecting with the keyboard', () => {
    let mounted: MountedComboBox | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should own the combobox role and open a listbox of options on ArrowDown', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer' });

        expect(mounted.input.getAttribute('role')).to.equal('combobox');
        expect(mounted.input.getAttribute('aria-expanded')).to.equal('false');
        expect(listbox()).to.equal(null);

        await pressComboBoxKey(mounted, 'ArrowDown');

        expect(mounted.input.getAttribute('aria-expanded')).to.equal('true');
        expect(listbox()?.getAttribute('role')).to.equal('listbox');
        expect(mounted.input.getAttribute('aria-controls')).to.equal(listbox()?.id);
        expect(options().map((option) => option.getAttribute('role'))).to.deep.equal([
            'option',
            'option',
            'option',
        ]);
        expect(options()[2].getAttribute('aria-disabled')).to.equal('true');
    });

    it('should move with the arrow keys and select with Enter, reporting the key', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer' });

        await pressComboBoxKey(mounted, 'ArrowDown');
        await pressComboBoxKey(mounted, 'ArrowDown');
        expect(mounted.input.getAttribute('aria-activedescendant')).to.equal(
            options()[1].id,
        );

        await pressComboBoxKey(mounted, 'Enter');

        expect(mounted.changes).to.deep.equal(['birk']);
        expect(mounted.input.value).to.equal('Birk Consulting');
        expect(mounted.input.getAttribute('aria-expanded')).to.equal('false');
    });

    it('should filter as text is typed and report the text', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer' });

        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'bi');

        expect(mounted.inputs).to.deep.equal(['bi']);
        expect(options().map((option) => option.textContent)).to.deep.equal([
            'Birk Consulting912 345 688',
        ]);
        expect(
            options()[0].querySelector('[data-cratis-part="optionDescription"]')
                ?.textContent,
        ).to.equal('912 345 688');
    });

    it('should filter by prefix when asked, and not at all when the consumer filters', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer', filter: 'startsWith' });
        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'cons');
        expect(options()).to.have.lengthOf(0);
        await unmountPrimitive(mounted);

        mounted = await mountComboBox({ 'aria-label': 'Customer', filter: 'none' });
        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'zzz');
        expect(options()).to.have.lengthOf(3);
    });

    it('should open on focus only when asked', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer', openOnFocus: true });
        await focusComboBox(mounted);
        expect(mounted.input.getAttribute('aria-expanded')).to.equal('true');
        await unmountPrimitive(mounted);

        mounted = await mountComboBox({ 'aria-label': 'Customer' });
        await focusComboBox(mounted);
        expect(mounted.input.getAttribute('aria-expanded')).to.equal('false');
    });

    it('should close on Escape without changing the selection', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer', initialValue: 'acme' });

        expect(mounted.input.value).to.equal('Acme AS');
        await pressComboBoxKey(mounted, 'ArrowDown');
        await pressComboBoxKey(mounted, 'Escape');

        expect(mounted.input.getAttribute('aria-expanded')).to.equal('false');
        expect(mounted.changes).to.deep.equal([]);
    });
});
