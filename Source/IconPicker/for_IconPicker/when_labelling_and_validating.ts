// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { open, renderPicker, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when labelling and validating', () => {
    let picker: PickerInTheDom;

    afterEach(async () => {
        await unmount(picker);
    });

    describe('with an accessible name', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                'aria-label': 'Toolbar icon',
                initialValue: { library: 'example-glyphs', key: 'map' },
            });
        });

        it('should name the trigger with the selected icon', () =>
            picker.trigger().getAttribute('aria-label')!.should.equal('Toolbar icon: Map'));
    });

    describe('with an external label', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                'aria-labelledby': 'external-label',
                initialValue: { library: 'example-glyphs', key: 'map' },
            });
        });

        it('should reference the label and the selected name', () =>
            picker.trigger().getAttribute('aria-labelledby')!.should.match(/^external-label .+/));
    });

    describe('with a validation message', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog(), validationMessage: 'Choose an icon.' });
        });

        it('should show the message', () =>
            picker.container.querySelector('[data-cratis-part="message"]')!.textContent!.should.equal('Choose an icon.'));
        it('should mark the root invalid', () =>
            picker.container.querySelector('[data-cratis-part="root"]')!.hasAttribute('data-invalid').should.be.true);
        it('should mark the trigger invalid', () => picker.trigger().hasAttribute('data-invalid').should.be.true);
        it('should describe the trigger by the message', () =>
            picker.container.querySelector(`#${picker.trigger().getAttribute('aria-describedby')}`)!.textContent!.should.contain('Choose an icon.'));
    });

    describe('with translated labels', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                labels: { placeholder: 'Velg ikon', title: 'Velg et ikon', summary: ({ count }) => `${count} treff` },
            });
            await open(picker);
        });

        it('should translate the placeholder', () => picker.trigger().textContent!.should.contain('Velg ikon'));
        it('should translate the title', () =>
            document.body.querySelector('[data-cratis-part="title"]')!.textContent!.should.equal('Velg et ikon'));
        it('should translate the summary', () =>
            document.body.querySelector('[data-cratis-part="summary"]')!.textContent!.should.equal('9 treff'));
        it('should leave the labels not overridden in English', () =>
            document.body.querySelector('[data-cratis-part="close"]')!.getAttribute('aria-label')!.should.equal('Close'));
    });

    describe('with part pass-through', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                pt: { root: { className: 'host-root' }, trigger: { className: 'host-trigger' }, tile: { 'data-host': 'tile' } },
            });
            await open(picker);
        });

        it('should merge the root class', () => (picker.container.querySelector('.cratis-icon-picker.host-root') !== null).should.be.true);
        it('should merge the trigger class', () => picker.trigger().classList.contains('host-trigger').should.be.true);
        it('should pass attributes to every tile', () =>
            document.body.querySelector('[data-cratis-part="tile"]')!.getAttribute('data-host')!.should.equal('tile'));
    });
});
