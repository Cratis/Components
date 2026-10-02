// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { twoLibraryCatalog } from './given/a_synthetic_catalog';
import { click, open, renderPicker, tileNames, unmount, type PickerInTheDom } from './given/a_picker_in_the_dom';

const status = () => document.body.querySelector('[data-cratis-part="status"]');

describe('when the catalog is not ready', () => {
    let picker: PickerInTheDom;

    afterEach(async () => {
        await unmount(picker);
    });

    describe('and it is loading', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: { ...twoLibraryCatalog(), icons: twoLibraryCatalog().icons.slice(0, 2), status: 'loading' } });
            await open(picker);
        });

        it('should say it is loading', () => status()!.textContent!.should.equal('Loading icons…'));
        it('should mark the state loading', () => status()!.hasAttribute('data-loading').should.be.true);
        it('should keep the icons already loaded', () => tileNames().should.deep.equal(['Home', 'Map']));
    });

    describe('and it is loading more of what is selected', () => {
        beforeEach(async () => {
            const catalog = twoLibraryCatalog();
            picker = await renderPicker({
                catalog: { ...catalog, icons: catalog.icons.slice(0, 2), status: 'loading' },
                initialValue: { library: 'example-glyphs', key: 'map' },
            });
            await open(picker);
        });

        it('should select the loaded icon', () =>
            document.body.querySelector('[data-cratis-part="tile"][aria-selected="true"]')!.textContent!.should.contain('Map'));
    });

    describe('and it has no icons', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: { libraries: [], icons: [] } });
            await open(picker);
        });

        it('should say there are none', () => status()!.textContent!.should.equal('There are no icons to choose from.'));
        it('should not state a count', () => (document.body.querySelector('[data-cratis-part="summary"]') === null).should.be.true);
    });

    describe('and the provider failed', () => {
        beforeEach(async () => {
            picker = await renderPicker({
                catalog: { ...twoLibraryCatalog(), icons: [], status: 'error', error: 'Example library did not respond.' },
            });
            await open(picker);
        });

        it('should announce the failure as an alert', () => status()!.getAttribute('role')!.should.equal('alert'));
        it('should show the host message', () => status()!.textContent!.should.equal('Example library did not respond.'));
    });

    describe('and the provider failed without a message', () => {
        beforeEach(async () => {
            picker = await renderPicker({ catalog: { libraries: [], icons: [], status: 'error' }, labels: { error: 'Nope.' } });
            await open(picker);
            await click(document.body.querySelector('[data-cratis-part="close"]')!);
        });

        it('should fall back to the error label', async () => {
            await open(picker);
            status()!.textContent!.should.equal('Nope.');
        });
    });
});
