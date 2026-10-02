// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, dialog, press, renderPicker, settle, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when read-only or disabled', () => {
    let picker: PickerInTheDom;

    afterEach(async () => {
        await unmount(picker);
    });

    describe('and read-only', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: twoLibraryCatalog(),
                readOnly: true,
                initialValue: { library: 'example-glyphs', key: 'home' },
            });
            await click(picker.trigger());
            await press(picker.trigger(), 'Enter');
            await settle();
        });

        it('should show the selection', () => picker.trigger().textContent!.should.contain('Home'));
        it('should not open the popout', () => (dialog() === null).should.be.true);
        it('should emit nothing', () => picker.changes.should.be.empty);
        it('should stay focusable', () => (picker.trigger().disabled === false).should.be.true);
        it('should be marked read-only', () => picker.trigger().hasAttribute('data-readonly').should.be.true);
        it('should tell assistive technology it is unavailable', () => picker.trigger().getAttribute('aria-disabled')!.should.equal('true'));
    });

    describe('and disabled', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog(), disabled: true });
            await click(picker.trigger());
            await settle();
        });

        it('should disable the trigger', () => picker.trigger().disabled.should.be.true);
        it('should not open the popout', () => (dialog() === null).should.be.true);
        it('should emit nothing', () => picker.changes.should.be.empty);
    });

    describe('and it turns read-only while the popout is open', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: twoLibraryCatalog() });
        });

        it('should not emit what is picked', async () => {
            await unmount(picker);
            picker = await renderPicker({ catalog: twoLibraryCatalog(), readOnly: true });
            picker.changes.should.be.empty;
        });
    });
});
