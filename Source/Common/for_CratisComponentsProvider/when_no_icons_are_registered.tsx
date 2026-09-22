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
 * The additive half of the icon contract: with a provider that registers no icons at all, every
 * wired site keeps drawing the exact glyph it hard-coded before the vocabulary existed. This is the
 * property a product upgrading to the icon-aware release depends on — nothing moves until it asks.
 */
describe('when no icons are registered', () => {
    let container: HTMLDivElement;
    let root: Root;

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
                <CratisComponentsProvider value={{ locale: 'en-US' }}>
                    <Dialog title='Default dialog'>Body</Dialog>
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

    it('should keep the built-in dismissal and removal glyphs', () => {
        expect(
            document.querySelector('[data-cratis-part="close"]')?.textContent,
        ).to.equal('×');
        expect(
            container.querySelector('.cratis-tag-group__remove')?.textContent,
        ).to.equal('×');
        expect(container.querySelector('.cratis-chip__remove')?.textContent).to.equal(
            '×',
        );
        expect(container.querySelector('.cratis-dropdown__clear')?.textContent).to.equal(
            '×',
        );
        expect(
            document.querySelector('.cratis-toast [data-cratis-part="close"]')
                ?.textContent,
        ).to.equal('×');
    });

    it('should keep each surface its own built-in chevron', () => {
        expect(
            container.querySelector('.cratis-dropdown__indicator')?.textContent,
        ).to.equal('⌄');
        expect(
            container.querySelector('.cratis-combobox__trigger')?.textContent,
        ).to.equal('▾');
    });

    it('should keep the built-in sort indicators', async () => {
        await act(async () => sortButton()?.click());
        expect(sortButton()?.textContent).to.contain('▲');
        await act(async () => sortButton()?.click());
        expect(sortButton()?.textContent).to.contain('▼');
    });

    it('should keep the built-in paginator navigation glyphs', () => {
        const buttons = Array.from(
            container.querySelectorAll('.cratis-table-paginator button'),
        ).map((element) => element.textContent);
        expect(buttons).to.contain('‹');
        expect(buttons).to.contain('›');
    });

    it('should keep the built-in busy marks', () => {
        expect(container.querySelector('.cratis-progress-spinner__svg')).not.to.equal(
            null,
        );
        expect(document.querySelector('.cratis-toast__icon')?.textContent).to.equal('◌');
    });
});
