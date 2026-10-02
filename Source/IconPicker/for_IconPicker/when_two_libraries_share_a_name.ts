// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, open, renderPicker, tileNamed, tiles, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when two libraries share an icon name', () => {
    let picker: PickerInTheDom;

    afterEach(async () => {
        await unmount(picker);
    });

    describe('and the second library icon is picked', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog() });
            await open(picker);
            await click(tileNamed('Home', 'Sample Symbols')!);
        });

        it('should emit the qualified identity of that library', () =>
            picker.changes.should.deep.equal([{ library: 'sample-symbols', key: 'home' }]));
        it('should show the provider in the trigger', () => picker.trigger().textContent!.should.contain('Sample Symbols'));
    });

    describe('and the first library icon is selected', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog(), initialValue: { library: 'example-glyphs', key: 'home' } });
            await open(picker);
        });

        it('should select only the icon of that library', () =>
            tiles()
                .filter(tile => tile.getAttribute('aria-selected') === 'true')
                .map(tile => tile.querySelector('[data-cratis-part="provider"]')!.textContent)
                .should.deep.equal(['Example Glyphs']));
    });

    describe('and the variants of one key are told apart', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                initialValue: { library: 'sample-symbols', key: 'gear', variant: 'outline' },
            });
            await open(picker);
        });

        it('should select the variant that matches', () =>
            tiles()
                .filter(tile => tile.getAttribute('aria-selected') === 'true')
                .map(tile => tile.querySelector('[data-cratis-part="tileName"]')!.textContent)
                .should.deep.equal(['Gear outline']));
        it('should name the variant in the trigger', () => picker.trigger().textContent!.should.contain('Gear outline'));
    });

    describe('and a variant is picked', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog() });
            await open(picker);
            await click(tileNamed('Gear outline')!);
        });

        it('should emit the variant with the identity', () =>
            picker.changes.should.deep.equal([{ library: 'sample-symbols', key: 'gear', variant: 'outline' }]));
        it('should emit nothing but the identity', () => Object.keys(picker.changes[0]).sort().should.deep.equal(['key', 'library', 'variant']));
    });
});
