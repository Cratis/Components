// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { entry, exampleGlyphs, sampleSymbols, twoLibraryCatalog } from './given/a_synthetic_catalog';
import { renderPicker, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when describing the selection', () => {
    let picker: PickerInTheDom;
    const messages = () =>
        [...picker.container.querySelectorAll('[data-cratis-part="message"]')].map(message => message.textContent);

    afterEach(async () => {
        await unmount(picker);
    });

    describe('with a host description and no message', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog(), 'aria-describedby': 'example-hint' });
        });

        it('should describe the trigger by the host description alone', () =>
            picker.trigger().getAttribute('aria-describedby')!.should.equal('example-hint'));
        it('should render no messages', () => (picker.container.querySelector('.cratis-icon-picker__messages') === null).should.be.true);
    });

    describe('without a description or message', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog() });
        });

        it('should not describe the trigger', () => picker.trigger().hasAttribute('aria-describedby').should.be.false);
        it('should not mark the root invalid', () =>
            picker.container.querySelector('[data-cratis-part="root"]')!.hasAttribute('data-invalid').should.be.false);
    });

    describe('with a host description, a missing selection and a validation message', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                'aria-describedby': 'example-hint',
                validationMessage: 'Choose another icon.',
                initialValue: { library: 'retired-library', key: 'home' },
            });
        });

        it('should describe the trigger by the host description and then the messages', () => {
            const [hint, messageId] = picker.trigger().getAttribute('aria-describedby')!.split(' ');
            hint.should.equal('example-hint');
            picker.container.querySelector(`#${messageId}`)!.className.should.equal('cratis-icon-picker__messages');
        });
        it('should show the missing selection before the validation message', () =>
            messages().should.deep.equal([
                'The selected icon retired-library / home is not in the catalog.',
                'Choose another icon.',
            ]));
    });

    describe('with a validation message but explicitly valid', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog(), validationMessage: 'Example note.', invalid: false });
        });

        it('should not mark the root invalid', () =>
            picker.container.querySelector('[data-cratis-part="root"]')!.hasAttribute('data-invalid').should.be.false);
        it('should still show the message', () => messages().should.deep.equal(['Example note.']));
    });

    describe('with a selection from a library the catalog does not list', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: {
                    libraries: [exampleGlyphs, sampleSymbols],
                    icons: [entry('unlisted-library', 'star', 'Star', ['Shapes'])],
                },
                initialValue: { library: 'unlisted-library', key: 'star' },
            });
        });

        it('should name the provider by the library id', () => picker.trigger().textContent!.should.contain('unlisted-library'));
    });

    describe('while the catalog is loading and the selection is not yet listed', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: { ...twoLibraryCatalog(), status: 'loading' },
                initialValue: { library: 'retired-library', key: 'home' },
            });
        });

        it('should not explain a missing selection', () => messages().should.be.empty);
        it('should not mark the trigger missing', () => picker.trigger().hasAttribute('data-missing').should.be.false);
    });
});
