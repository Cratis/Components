// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, open, renderPicker, tileNames, typeSearch, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

describe('when searching', () => {
    let picker: PickerInTheDom;

    beforeEach(async () => {
        picker = await renderPicker({ catalog: twoLibraryCatalog() });
        await open(picker);
    });

    afterEach(async () => {
        await unmount(picker);
    });

    describe('by name in a different case', () => {
        beforeEach(async () => {
            await typeSearch('ARROW');
        });

        it('should list only the matching icons', () => tileNames().should.deep.equal(['Arrow left', 'Arrow right']));
        it('should state the count and the search', () =>
            document.body.querySelector('[data-cratis-part="summary"]')!.textContent!.should.equal('2 icons matching “ARROW”'));
    });

    describe('by a tag', () => {
        beforeEach(async () => {
            await typeSearch('settings');
        });

        it('should find the tagged icon', () => tileNames().should.deep.equal(['Gear']));
    });

    describe('by an alias', () => {
        beforeEach(async () => {
            await typeSearch('back');
        });

        it('should find the aliased icon', () => tileNames().should.deep.equal(['Arrow left']));
    });

    describe('by several words', () => {
        beforeEach(async () => {
            await typeSearch('gear outline');
        });

        it('should require every word', () => tileNames().should.deep.equal(['Gear outline']));
    });

    describe('with nothing matching', () => {
        beforeEach(async () => {
            await typeSearch('zzz');
        });

        it('should say nothing matches the search', () =>
            document.body.querySelector('[data-cratis-part="status"]')!.textContent!.should.contain('No icons match “zzz”.'));
        it('should list no icons', () => tileNames().should.be.empty);

        describe('and the filters are cleared', () => {
            beforeEach(async () => {
                await click(document.body.querySelector('[data-cratis-part="status"] button')!);
            });

            it('should empty the search field', () =>
                (document.body.querySelector('[data-cratis-part="search"]') as HTMLInputElement).value.should.equal(''));
            it('should list icons again', () => tileNames().length.should.be.greaterThan(0));
        });
    });

    describe('and the search is cleared with its button', () => {
        beforeEach(async () => {
            await typeSearch('gear');
            await click(document.body.querySelector('[data-cratis-part="clear"]')!);
        });

        it('should empty the search field', () =>
            (document.body.querySelector('[data-cratis-part="search"]') as HTMLInputElement).value.should.equal(''));
        it('should return focus to the search field', () =>
            document.activeElement!.getAttribute('data-cratis-part')!.should.equal('search'));
        it('should remove the clear button', () =>
            (document.body.querySelector('[data-cratis-part="clear"]') === null).should.be.true);
    });
});
