// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { oneLibraryCatalog, twoLibraryCatalog } from './given/a_synthetic_catalog';
import { dialog, open, renderPicker, tileNames, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when opening', () => {
    let picker: PickerInTheDom;

    afterEach(async () => {
        await unmount(picker);
    });

    describe('with nothing selected', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog() });
        });

        it('should show the placeholder in the trigger', () =>
            picker.trigger().textContent!.should.contain('Select an icon'));
        it('should start closed', () => (dialog() === null).should.be.true);

        describe('and the trigger is pressed', () => {
            beforeEach(async () => {
                await open(picker);
            });

            it('should show the title', () =>
                document.body.querySelector('[data-cratis-part="title"]')!.textContent!.should.equal('Choose an icon'));
            it('should show a search field', () =>
                (document.body.querySelector('[data-cratis-part="search"]') !== null).should.be.true);
            it('should name the search field', () =>
                document.body.querySelector('[data-cratis-part="search"]')!.getAttribute('aria-label')!.should.equal('Search icons'));
            it('should show a close action', () =>
                document.body.querySelector('[data-cratis-part="close"]')!.getAttribute('aria-label')!.should.equal('Close'));
            it('should browse compact category groups', () =>
                document.body.querySelectorAll('[data-cratis-part="group"]').length.should.equal(4));
            it('should list every icon of the groups', () => tileNames().length.should.be.greaterThan(0));
            it('should mark the trigger open', () => picker.trigger().hasAttribute('data-open').should.be.true);
            it('should focus the search field', () =>
                document.activeElement!.getAttribute('data-cratis-part')!.should.equal('search'));
        });
    });

    describe('with several libraries', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog() });
            await open(picker);
        });

        it('should offer a library filter', () =>
            (document.body.querySelector('[data-cratis-part="library"]') !== null).should.be.true);
        it('should name the provider on every tile', () =>
            document.body.querySelectorAll('[data-cratis-part="tile"] [data-cratis-part="provider"]').length.should.equal(
                document.body.querySelectorAll('[data-cratis-part="tile"]').length,
            ));
        it('should credit the libraries that supply attribution or a version', () =>
            document.body.querySelector('[data-cratis-part="attribution"]')!.textContent!.should.equal(
                'Example Glyphs · 1.2.0 · Synthetic glyphs for examples',
            ));
    });

    describe('with one library', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: oneLibraryCatalog() });
            await open(picker);
        });

        it('should not offer a library filter', () =>
            (document.body.querySelector('[data-cratis-part="library"]') === null).should.be.true);
        it('should not name a provider on the tiles', () =>
            (document.body.querySelector('[data-cratis-part="tile"] [data-cratis-part="provider"]') === null).should.be.true);
    });
});
