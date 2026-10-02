// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, open, renderPicker, settle, tileNamed, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when the viewport is narrow', () => {
    let picker: PickerInTheDom;
    const original = window.matchMedia;

    beforeEach(async () => {
        window.matchMedia = ((query: string) => ({
            matches: true,
            media: query,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        })) as unknown as typeof window.matchMedia;
        picker = await renderPicker({ catalog: twoLibraryCatalog() });
        await open(picker);
    });

    afterEach(async () => {
        await unmount(picker);
        window.matchMedia = original;
    });

    it('should show the popout as a contained sheet', () =>
        (document.body.querySelector('.cratis-icon-picker__sheet') !== null).should.be.true);
    it('should not anchor it to the trigger', () =>
        (document.body.querySelector('.cratis-icon-picker__popover') === null).should.be.true);
    it('should still carry the popover part', () =>
        document.body.querySelector('.cratis-icon-picker__sheet')!.getAttribute('data-cratis-part')!.should.equal('popover'));

    describe('and an icon is picked', () => {
        beforeEach(async () => {
            await click(tileNamed('Map')!);
            await settle();
        });

        it('should emit the identity', () => picker.changes.should.deep.equal([{ library: 'example-glyphs', key: 'map' }]));
        it('should close the sheet', () => (document.body.querySelector('.cratis-icon-picker__sheet') === null).should.be.true);
        it('should return focus to the trigger', () => (document.activeElement === picker.trigger()).should.be.true);
    });
});
