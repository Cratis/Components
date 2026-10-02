// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { open, renderPicker, tiles, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when the selection is not in the catalog', () => {
    let picker: PickerInTheDom;

    afterEach(async () => {
        await unmount(picker);
    });

    describe('while the key exists only in another library', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                initialValue: { library: 'retired-library', key: 'home' },
            });
        });

        it('should show the raw qualified identity', () => picker.trigger().textContent!.should.contain('retired-library / home'));
        it('should not substitute a same-named icon', () =>
            (picker.trigger().querySelector('[data-glyph]') === null).should.be.true);
        it('should mark the trigger missing', () => picker.trigger().hasAttribute('data-missing').should.be.true);
        it('should explain it', () =>
            picker.container.querySelector('[data-cratis-part="message"]')!.textContent!.should.equal(
                'The selected icon retired-library / home is not in the catalog.',
            ));
        it('should describe the trigger by the explanation', () =>
            picker.container.querySelector(`#${picker.trigger().getAttribute('aria-describedby')}`)!.textContent!.should.contain('not in the catalog'));

        describe('and the popout is opened', () => {
            beforeEach(async () => {
                await open(picker);
            });

            it('should select nothing', () =>
                tiles().filter(tile => tile.getAttribute('aria-selected') === 'true').should.be.empty);
        });
    });

    describe('while the catalog is still loading', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: { ...twoLibraryCatalog(), icons: [], status: 'loading' },
                initialValue: { library: 'example-glyphs', key: 'home' },
            });
        });

        it('should show the identity without a warning', () => {
            picker.trigger().textContent!.should.contain('example-glyphs / home');
            picker.trigger().hasAttribute('data-missing').should.be.false;
        });
    });
});
