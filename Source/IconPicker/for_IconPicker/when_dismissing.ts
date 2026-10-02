// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, dialog, open, press, renderPicker, settle, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when dismissing', () => {
    let picker: PickerInTheDom;

    beforeEach(async () => {
        picker = await renderPicker({ catalog: twoLibraryCatalog(), initialValue: { library: 'example-glyphs', key: 'home' } });
        await open(picker);
    });

    afterEach(async () => {
        await unmount(picker);
    });

    describe('with Escape', () => {
        beforeEach(async () => {
            await press(document.body.querySelector('[data-cratis-part="search"]')!, 'Escape');
            await settle();
        });

        it('should close the popout', () => (dialog() === null).should.be.true);
        it('should not change the selection', () => picker.changes.should.be.empty);
        it('should return focus to the trigger', () => (document.activeElement === picker.trigger()).should.be.true);
    });

    describe('with the close action', () => {
        beforeEach(async () => {
            await click(document.body.querySelector('[data-cratis-part="close"]')!);
            await settle();
        });

        it('should close the popout', () => (dialog() === null).should.be.true);
        it('should not change the selection', () => picker.changes.should.be.empty);
        it('should return focus to the trigger', () => (document.activeElement === picker.trigger()).should.be.true);
    });

    describe('by pressing outside', () => {
        beforeEach(async () => {
            await act(async () => {
                for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
                    document.body.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: 1, clientY: 1 }));
                }
            });
            await settle();
        });

        it('should close the popout', () => (dialog() === null).should.be.true);
        it('should not change the selection', () => picker.changes.should.be.empty);
    });
});
