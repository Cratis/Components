// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, dialog, open, press, renderPicker, settle, tileNamed, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when selecting', () => {
    let picker: PickerInTheDom;

    beforeEach(async () => {
        picker = await renderPicker({ catalog: twoLibraryCatalog(), initialValue: { library: 'example-glyphs', key: 'home' } });
        await open(picker);
        await click(tileNamed('Map')!);
        await settle();
    });

    afterEach(async () => {
        await unmount(picker);
    });

    it('should emit the qualified identity', () => picker.changes.should.deep.equal([{ library: 'example-glyphs', key: 'map' }]));
    it('should close the popout', () => (dialog() === null).should.be.true);
    it('should return focus to the trigger', () => (document.activeElement === picker.trigger()).should.be.true);
    it('should show the new selection in the trigger', () => picker.trigger().textContent!.should.contain('Map'));

    describe('and the popout is reopened', () => {
        beforeEach(async () => {
            await open(picker);
        });

        it('should start without a search', () =>
            (document.body.querySelector('[data-cratis-part="search"]') as HTMLInputElement).value.should.equal(''));
        it('should mark the new selection', () =>
            tileNamed('Map')!.getAttribute('aria-selected')!.should.equal('true'));
    });

    describe('with the keyboard', () => {
        beforeEach(async () => {
            await open(picker);
            const tile = tileNamed('Arrow right')!;
            await act(async () => tile.focus());
            await press(tile, 'Enter');
            await settle();
        });

        it('should emit the identity of the icon', () =>
            picker.changes.at(-1)!.should.deep.equal({ library: 'example-glyphs', key: 'arrow-right' }));
    });
});
