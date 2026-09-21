// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { unmountPrimitive } from '../for_Primitives/given/a_primitive_dom';
import {
    focusComboBox,
    mountComboBox,
    options,
    pressComboBoxKey,
    pressComboBoxTrigger,
    typeIntoComboBox,
    type MountedComboBox,
} from './given/a_combobox';

const labels = () =>
    options().map(
        (option) =>
            option.querySelector('[data-cratis-part="optionLabel"]')?.textContent,
    );

describe('when the list is opened with a selection', () => {
    let mounted: MountedComboBox | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should offer every option on ArrowDown, not only the selected one', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer', initialValue: 'acme' });

        expect(mounted.input.value).to.equal('Acme AS');
        await pressComboBoxKey(mounted, 'ArrowDown');

        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });

    it('should offer every option when the trigger opens the list', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer', initialValue: 'birk' });

        await pressComboBoxTrigger(mounted);

        expect(mounted.input.getAttribute('aria-expanded')).to.equal('true');
        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });

    it('should offer every option when focus opens the list', async () => {
        mounted = await mountComboBox({
            'aria-label': 'Customer',
            initialValue: 'acme',
            openOnFocus: true,
        });

        await focusComboBox(mounted);

        expect(mounted.input.getAttribute('aria-expanded')).to.equal('true');
        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });

    it('should narrow to the typed text once the user types', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer', initialValue: 'acme' });

        await pressComboBoxKey(mounted, 'ArrowDown');
        expect(options()).to.have.lengthOf(3);
        await typeIntoComboBox(mounted, 'bi');

        expect(labels()).to.deep.equal(['Birk Consulting']);
    });

    it('should offer every option again when the list is reopened after a selection', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer' });

        await pressComboBoxKey(mounted, 'ArrowDown');
        await pressComboBoxKey(mounted, 'ArrowDown');
        await pressComboBoxKey(mounted, 'Enter');
        expect(mounted.changes).to.deep.equal(['birk']);
        expect(mounted.input.value).to.equal('Birk Consulting');

        await pressComboBoxKey(mounted, 'ArrowDown');

        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });

    it('should offer every option when the input is cleared', async () => {
        mounted = await mountComboBox({ 'aria-label': 'Customer', initialValue: 'acme' });

        await pressComboBoxKey(mounted, 'ArrowDown');
        await typeIntoComboBox(mounted, 'bi');
        expect(options()).to.have.lengthOf(1);
        await typeIntoComboBox(mounted, '');

        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });

    it('should offer every option when the value names no option', async () => {
        mounted = await mountComboBox({
            'aria-label': 'Customer',
            initialValue: 'gone',
        });

        expect(mounted.input.value).to.equal('');
        await pressComboBoxKey(mounted, 'ArrowDown');

        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });

    it('should keep showing what it is given when the consumer filters', async () => {
        mounted = await mountComboBox({
            'aria-label': 'Customer',
            initialValue: 'acme',
            filter: 'none',
        });

        await pressComboBoxKey(mounted, 'ArrowDown');
        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);

        await typeIntoComboBox(mounted, 'zzz');

        expect(mounted.inputs).to.deep.equal(['zzz']);
        expect(labels()).to.deep.equal(['Acme AS', 'Birk Consulting', 'Cirrus Cloud']);
    });
});
