// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CratisComponentsProvider } from '../CratisComponentsProvider';
import { ComboBox } from '../ComboBox';
import { TagGroup } from '../TagGroup';
import { Chip } from '../../Display/Chip';
import { ProgressSpinner } from '../../Display/ProgressSpinner';
import { Dropdown } from '../../Dropdown/Dropdown';
import { Dialog } from '../../Dialogs/Dialog';
import { Toaster, toast } from '../../Notifications';
import { Column } from '../../DataTables/Column';
import { DataTableCore } from '../../DataTables/DataTableCore';
import { TablePaginator } from '../../DataTables/TablePaginator';

/**
 * Sentinel-provider gate for the first-cut icon vocabulary, mirroring the message gate next to it:
 * every name is registered as an unmistakable sentinel string, every component that draws that
 * concept is rendered at once, and every site is asserted to draw the sentinel instead of the glyph
 * it has always hard-coded. The final assertion also proves the reverse — none of the replaced
 * built-in glyphs survives anywhere in the rendered markup.
 */
describe('when every first-cut icon is overridden through the provider', () => {
    let container: HTMLDivElement;
    let root: Root;

    const sentinelIcons = {
        close: 'SENTINEL-close',
        remove: 'SENTINEL-remove',
        expand: 'SENTINEL-expand',
        sortAscending: 'SENTINEL-sort-ascending',
        sortDescending: 'SENTINEL-sort-descending',
        previous: 'SENTINEL-previous',
        next: 'SENTINEL-next',
        clear: 'SENTINEL-clear',
    };

    // No '◌': a loading toast's busy mark is deliberately outside the vocabulary, because the
    // concept's other site is ProgressSpinner's ring, and that is an svg publishing three parts
    // rather than a glyph — a registered icon there would delete parts a product may be styling.
    const replacedGlyphs = ['×', '⌄', '▾', '▲', '▼', '‹', '›'];

    beforeEach(async () => {
        // SAFETY: React's jsdom act-environment flag is runtime-only and absent from the
        // TypeScript global declaration used by this spec.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        // SAFETY: jsdom does not implement ResizeObserver, while the rendered DataTable uses it;
        // this test-local structural shim supplies only the methods that component calls.
        (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
            observe() {
                return undefined;
            }
            unobserve() {
                return undefined;
            }
            disconnect() {
                return undefined;
            }
        };
        toast.dismiss();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);

        await act(async () => {
            root.render(
                <CratisComponentsProvider value={{ icons: sentinelIcons }}>
                    <Dialog title='Sentinel dialog'>Body</Dialog>
                    <TagGroup
                        value={['alpha']}
                        aria-label='Tags'
                        removeLabel={(entry) => `Remove ${entry}`}
                    />
                    <Chip label='Alpha' removable />
                    <Dropdown
                        value='frontend'
                        options={[{ label: 'Frontend', value: 'frontend' }]}
                        showClear
                    />
                    <Dropdown
                        value='frontend'
                        options={[{ label: 'Frontend', value: 'frontend' }]}
                        filter
                        showClear
                    />
                    <Dropdown
                        value={['frontend']}
                        options={[{ label: 'Frontend', value: 'frontend' }]}
                        multiple
                        showClear
                    />
                    <ComboBox
                        options={[{ key: 'frontend', label: 'Frontend' }]}
                        value='frontend'
                        aria-label='Stack'
                    />
                    <DataTableCore
                        data={[{ name: 'Sample User' }]}
                        dataKey='name'
                        emptyMessage='No rows'
                    >
                        <Column field='name' header='Name' sortable />
                    </DataTableCore>
                    <TablePaginator
                        page={1}
                        pageCount={4}
                        onPageChange={() => undefined}
                    />
                    <ProgressSpinner />
                    <Toaster timeout={60_000} />
                </CratisComponentsProvider>,
            );
        });

        await act(async () => {
            toast({ title: 'Working', loading: true });
        });
    });

    afterEach(async () => {
        await act(async () => {
            toast.dismiss();
            root.unmount();
        });
        container.remove();
    });

    const sortButton = () =>
        container.querySelector<HTMLButtonElement>('[data-cratis-part="sort"]');

    it('should draw the registered close icon in the dialog header', () => {
        expect(
            document.querySelector('[data-cratis-part="close"]')?.textContent,
        ).to.equal('SENTINEL-close');
    });

    it('should draw the registered remove icon in a tag group and a chip', () => {
        expect(
            container.querySelector('.cratis-tag-group__remove')?.textContent,
        ).to.equal('SENTINEL-remove');
        expect(container.querySelector('.cratis-chip__remove')?.textContent).to.equal(
            'SENTINEL-remove',
        );
    });

    it('should draw the registered expand icon on every dropdown branch and on the combo box', () => {
        const triggers = Array.from(
            container.querySelectorAll('.cratis-dropdown__indicator'),
        ).map((element) => element.textContent);
        expect(triggers.length).to.be.greaterThan(0);
        for (const trigger of triggers) expect(trigger).to.equal('SENTINEL-expand');
        expect(
            container.querySelector('.cratis-combobox__trigger')?.textContent,
        ).to.equal('SENTINEL-expand');
    });

    it('should draw the registered clear icon on every dropdown clear action', () => {
        const clears = Array.from(
            container.querySelectorAll('.cratis-dropdown__clear'),
        ).map((element) => element.textContent);
        expect(clears.length).to.be.greaterThan(0);
        for (const clear of clears) expect(clear).to.equal('SENTINEL-clear');
    });

    it('should draw the registered ascending and descending sort icons', async () => {
        await act(async () => sortButton()?.click());
        expect(sortButton()?.textContent).to.contain('SENTINEL-sort-ascending');
        await act(async () => sortButton()?.click());
        expect(sortButton()?.textContent).to.contain('SENTINEL-sort-descending');
    });

    it('should draw the registered previous and next icons in the paginator', () => {
        const buttons = Array.from(
            container.querySelectorAll('.cratis-table-paginator button'),
        ).map((element) => element.textContent);
        expect(buttons).to.contain('SENTINEL-previous');
        expect(buttons).to.contain('SENTINEL-next');
    });


    it('should draw the registered close icon on a toast dismiss action', () => {
        expect(
            document.querySelector('.cratis-toast [data-cratis-part="close"]')
                ?.textContent,
        ).to.equal('SENTINEL-close');
    });

    it('should never leave a replaced built-in glyph in the rendered markup', async () => {
        await act(async () => sortButton()?.click());
        const markup = document.body.textContent ?? '';
        for (const glyph of replacedGlyphs) expect(markup).not.to.contain(glyph);
    });
});
