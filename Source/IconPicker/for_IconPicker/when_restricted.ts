// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, dialog, open, renderPicker, tileNamed, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when the field restricts the icons', () => {
    let picker: PickerInTheDom;

    afterEach(async () => {
        await unmount(picker);
    });

    describe('to a list of qualified values', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                allowed: [{ library: 'sample-symbols', key: 'home' }],
            });
            await open(picker);
        });

        it('should keep every icon listed', () => (tileNamed('Map') !== undefined).should.be.true);
        it('should mark an icon outside the list unavailable', () => tileNamed('Map')!.getAttribute('aria-disabled')!.should.equal('true'));
        it('should say why', () => tileNamed('Map')!.textContent!.should.contain('Not available for this field'));
        it('should not mark an allowed icon', () => tileNamed('Home', 'Sample Symbols')!.hasAttribute('aria-disabled').should.be.false);
        it('should not treat a same-named icon of another library as allowed', () =>
            tileNamed('Home', 'Example Glyphs')!.getAttribute('aria-disabled')!.should.equal('true'));

        describe('and an unavailable icon is picked', () => {
            beforeEach(async () => {
                await click(tileNamed('Map')!);
            });

            it('should emit nothing', () => picker.changes.should.be.empty);
            it('should keep the popout open', () => (dialog() !== null).should.be.true);
        });

        describe('and an allowed icon is picked', () => {
            beforeEach(async () => {
                await click(tileNamed('Home', 'Sample Symbols')!);
            });

            it('should emit it', () => picker.changes.should.deep.equal([{ library: 'sample-symbols', key: 'home' }]));
        });
    });

    describe('to a predicate', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog(), allowed: entry => entry.categories.includes('Arrows') });
            await open(picker);
            await click(tileNamed('Gear')!);
            await click(tileNamed('Arrow left')!);
        });

        it('should emit only the icons it accepts', () =>
            picker.changes.should.deep.equal([{ library: 'example-glyphs', key: 'arrow-left' }]));
    });
});
