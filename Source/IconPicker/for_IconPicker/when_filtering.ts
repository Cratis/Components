// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { act } from 'react';
import { click, open, renderPicker, tileNames, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

const categoryButton = (text: string) =>
    [...document.body.querySelectorAll<HTMLElement>('[data-cratis-part="category"]')].find(button =>
        button.textContent!.startsWith(text),
    )!;

describe('when filtering', () => {
    let picker: PickerInTheDom;

    beforeEach(async () => {
        picker = await renderPicker({ catalog: twoLibraryCatalog() });
        await open(picker);
    });

    afterEach(async () => {
        await unmount(picker);
    });

    describe('by a category', () => {
        beforeEach(async () => {
            await click(categoryButton('Places'));
        });

        it('should list only that category', () => tileNames().should.deep.equal(['Home', 'Map', 'Home']));
        it('should press the category', () => categoryButton('Places').getAttribute('aria-pressed')!.should.equal('true'));
        it('should state the category', () =>
            document.body.querySelector('[data-cratis-part="summary"]')!.textContent!.should.equal('3 icons in Places'));
        it('should stop grouping', () => document.body.querySelectorAll('[data-cratis-part="group"]').length.should.equal(0));

        describe('and all categories are shown again', () => {
            beforeEach(async () => {
                await click(categoryButton('All'));
            });

            it('should group again', () => document.body.querySelectorAll('[data-cratis-part="group"]').length.should.equal(4));
        });
    });

    describe('by the group of icons without a category', () => {
        beforeEach(async () => {
            await click(categoryButton('Other'));
        });

        it('should list the uncategorized icons', () => tileNames().should.deep.equal(['Plain glyph']));
    });

    describe('by a library', () => {
        beforeEach(async () => {
            const select = document.body.querySelector<HTMLSelectElement>('[data-cratis-part="library"]')!;
            await act(async () => {
                const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
                setter.call(select, 'sample-symbols');
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });

        it('should list only that library', () =>
            tileNames().should.deep.equal(['Home', 'Gear', 'Gear outline', 'Old symbol']));
        it('should state the library', () =>
            document.body.querySelector('[data-cratis-part="summary"]')!.textContent!.should.equal('4 icons from Sample Symbols'));
        it('should credit only that library', () =>
            (document.body.querySelector('[data-cratis-part="attribution"]') === null).should.be.true);
    });

    describe('with a category larger than its compact group', () => {
        beforeEach(async () => {
            await unmount(picker);
            picker = await renderPicker({ catalog: twoLibraryCatalog(), compactGroupSize: 1 });
            await open(picker);
        });

        it('should show only the first icons of the group', () =>
            document.body.querySelectorAll('[data-cratis-part="group"]')[0].querySelectorAll('[data-cratis-part="tile"]').length.should.equal(1));
        it('should offer to show all of the group', () =>
            document.body.querySelector('[data-cratis-part="showAll"]')!.textContent!.should.equal('Show all 3'));

        describe('and show all is pressed', () => {
            beforeEach(async () => {
                await click(document.body.querySelector('[data-cratis-part="showAll"]')!);
            });

            it('should filter to that category', () => tileNames().should.deep.equal(['Home', 'Map', 'Home']));
        });
    });
});
