// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { open, press, typeSearch, renderPicker, tileNamed, tiles, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

/** The "Tools" group has three tiles: Gear, Gear outline, Old symbol - the grid assumes four columns in jsdom. */
describe('when navigating by keyboard', () => {
    let picker: PickerInTheDom;

    beforeEach(async () => {
        picker = await renderPicker({ catalog: twoLibraryCatalog() });
        await open(picker);
    });

    afterEach(async () => {
        await unmount(picker);
    });

    describe('from the search field with Down', () => {
        beforeEach(async () => {
            await press(document.body.querySelector('[data-cratis-part="search"]')!, 'ArrowDown');
        });

        it('should focus the first icon', () => (document.activeElement === tiles()[0]).should.be.true);
    });

    describe('within a grid', () => {
        let gear: HTMLElement;

        beforeEach(async () => {
            gear = tileNamed('Gear')!;
            await act(async () => gear.focus());
        });

        it('should make the focused icon the only tab stop of its grid', () =>
            [...gear.parentElement!.children].map(child => child.getAttribute('tabindex')).should.deep.equal(['0', '-1', '-1']));

        describe('and Right is pressed', () => {
            beforeEach(async () => {
                await press(gear, 'ArrowRight');
            });

            it('should focus the next icon', () => (document.activeElement === tileNamed('Gear outline')).should.be.true);
            it('should move the tab stop with focus', () =>
                tileNamed('Gear outline')!.getAttribute('tabindex')!.should.equal('0'));
        });

        describe('and End is pressed', () => {
            beforeEach(async () => {
                await press(gear, 'End');
            });

            it('should focus the last icon', () => (document.activeElement === tileNamed('Old symbol')).should.be.true);

            describe('and Left is pressed', () => {
                beforeEach(async () => {
                    await press(document.activeElement!, 'ArrowLeft');
                });

                it('should focus the previous icon', () => (document.activeElement === tileNamed('Gear outline')).should.be.true);
            });

            describe('and Home is pressed', () => {
                beforeEach(async () => {
                    await press(document.activeElement!, 'Home');
                });

                it('should focus the first icon', () => (document.activeElement === gear).should.be.true);
            });
        });

        describe('and Left is pressed on the first icon', () => {
            beforeEach(async () => {
                await press(gear, 'ArrowLeft');
            });

            it('should stay on the first icon', () => (document.activeElement === gear).should.be.true);
        });

        describe('and Down is pressed with fewer icons than a row', () => {
            beforeEach(async () => {
                await press(gear, 'ArrowDown');
            });

            it('should stay on the icon', () => (document.activeElement === gear).should.be.true);
        });
    });

    describe('across a row of search results', () => {
        beforeEach(async () => {
            await typeSearch('o');
            await act(async () => tiles()[1].focus());
        });

        it('should have more results than a row', () => tiles().length.should.be.greaterThan(5));

        describe('and Down is pressed', () => {
            beforeEach(async () => {
                await press(tiles()[1], 'ArrowDown');
            });

            it('should focus the icon a row below', () => (document.activeElement === tiles()[5]).should.be.true);

            describe('and Up is pressed', () => {
                beforeEach(async () => {
                    await press(document.activeElement!, 'ArrowUp');
                });

                it('should focus the icon a row above', () => (document.activeElement === tiles()[1]).should.be.true);
            });
        });
    });

    describe('with the category filter', () => {
        const categories = () => [...document.body.querySelectorAll<HTMLElement>('[data-cratis-part="category"]')];

        beforeEach(async () => {
            await act(async () => categories()[0].focus());
            await press(categories()[0], 'ArrowRight');
        });

        it('should move focus to the next category', () => (document.activeElement === categories()[1]).should.be.true);
        it('should not select it yet', () => categories()[1].getAttribute('aria-pressed')!.should.equal('false'));
    });

    describe('with Space on an icon', () => {
        beforeEach(async () => {
            const tile = tileNamed('Map')!;
            await act(async () => tile.focus());
            await press(tile, ' ');
        });

        it('should select it', () => picker.changes.should.deep.equal([{ library: 'example-glyphs', key: 'map' }]));
    });
});
