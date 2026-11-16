// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, expectTypeOf, it, vi } from 'vitest';
import { DataPage, type DataPageSelection, type MenuItemProps } from '../index';
import { adaptMenuItem } from '../adaptMenuItem';
import { render, unmount, type DataPageInTheDom } from './given/a_data_page';
import { type Person } from './given/a_paged_query_result';
import { activate, actionButton, menuPage, refreshMenuPage, selectRow, toggleRow,
    type MenuPageOptions } from './given/a_menu_selection';

const state = vi.hoisted(() => ({ rows: [] as { id: number; name: string; email: string }[] }));
vi.mock('@cratis/arc.react/queries', () => {
    const result = () => ({
        data: state.rows,
        paging: { page: 0, size: 20, totalItems: state.rows.length, totalPages: 1 },
        isSuccess: true, isAuthorized: true, isValid: true, hasExceptions: false, isPerforming: false,
    });
    const noop = () => undefined;
    return {
        useQueryWithPaging: () => [result(), noop, noop, noop, noop],
        useObservableQueryWithPaging: () => [result(), noop, noop, noop],
    };
});

describe('when menu actions use selection', () => {
    let page: DataPageInTheDom;
    let options: MenuPageOptions;
    let received: DataPageSelection<Person>[];

    const refresh = () => refreshMenuPage(page, options);
    const latest = () => received[received.length - 1];

    beforeEach(async () => {
        state.rows = [
            { id: 1, name: 'Sample User 01', email: 'sample01@example.invalid' },
            { id: 2, name: 'Sample User 02', email: 'sample02@example.invalid' },
        ];
        received = [];
        options = { command: (selection) => received.push(selection) };
        page = await render(menuPage(options));
    });
    afterEach(async () => unmount(page));

    it('should expose an empty single selection before choosing a row', async () => {
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: undefined });
    });

    it('should pass the latest uncontrolled single row even when the count stays the same', async () => {
        await selectRow(page, 0);
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[0] });
        await selectRow(page, 1);
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[1] });
        expect(received[0]).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[0] });
    });

    it('should reevaluate the predicate when A changes to B without changing the count', async () => {
        options.disabled = (selection) => selection.selectionMode === 'single' && selection.selectedItem?.id === 1;
        await refresh();
        await selectRow(page, 0);
        expect(actionButton(page).disabled).to.equal(true);
        await activate(page);
        expect(received).to.have.lengthOf(0);
        await selectRow(page, 1);
        expect(actionButton(page).disabled).to.equal(false);
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[1] });
    });

    it('should pass a frozen multiple-selection container without freezing application rows', async () => {
        options.selectionMode = 'multiple';
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'multiple', selectedItems: [] });
        await toggleRow(page, 0);
        await toggleRow(page, 1);
        await activate(page);
        const snapshot = latest();
        expect(snapshot.selectionMode).to.equal('multiple');
        if (snapshot.selectionMode !== 'multiple') throw new Error('Expected multiple selection');
        expect(snapshot.selectedItems).to.deep.equal(state.rows);
        expect(Object.isFrozen(snapshot)).to.equal(true);
        expect(Object.isFrozen(snapshot.selectedItems)).to.equal(true);
        expect(Object.isFrozen(state.rows[0])).to.equal(false);
        await toggleRow(page, 0);
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'multiple', selectedItems: [state.rows[1]] });
        expect(snapshot.selectedItems).to.have.lengthOf(2);
    });

    it('should update a controlled multiple selection and predicate with the same count', async () => {
        options.selectionMode = 'multiple';
        options.selectedItems = [state.rows[0]];
        options.disabled = (selection) => selection.selectionMode === 'multiple' && selection.selectedItems[0]?.id === 1;
        await refresh();
        expect(actionButton(page).disabled).to.equal(true);
        options.selectedItems = [state.rows[1]];
        await refresh();
        expect(actionButton(page).disabled).to.equal(false);
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'multiple', selectedItems: [state.rows[1]] });
        expect(options.selectedItems).to.have.lengthOf(1);
        expect(Object.isFrozen(options.selectedItems)).to.equal(false);
    });

    it('should use the reconciled replacement row and clear a removed single row', async () => {
        await selectRow(page, 0);
        const replacement = { ...state.rows[0], name: 'Updated Sample User 01' };
        state.rows = [replacement, state.rows[1]];
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: replacement });
        expect(Object.isFrozen(latest())).to.equal(true);
        state.rows = state.rows.slice(1);
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: null });
    });

    it('should retain the existing multiple selection when query rows change', async () => {
        options.selectionMode = 'multiple';
        await refresh();
        await toggleRow(page, 0);
        await toggleRow(page, 1);
        const selected = [...state.rows];
        state.rows = [{ ...state.rows[0], name: 'Updated Sample User 01' }];
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'multiple', selectedItems: selected });
        state.rows = [];
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'multiple', selectedItems: selected });
    });

    it('should expose only the committed controlled single selection until the parent accepts', async () => {
        options.selection = state.rows[0];
        options.onSelectionChange = vi.fn();
        await refresh();
        await selectRow(page, 1);
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[0] });
        options.selection = state.rows[1];
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[1] });
    });

    it('should not substitute a reconciled row when the controlled parent has not committed it', async () => {
        const original = state.rows[0];
        options.selection = original;
        options.onSelectionChange = vi.fn();
        await refresh();
        state.rows = [{ ...original, name: 'Refreshed Sample User 01' }];
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: original });
    });

    it('should keep a rejected controlled multiple change out of the payload', async () => {
        options.selectionMode = 'multiple';
        options.selectedItems = [state.rows[0]];
        options.onSelectedItemsChange = vi.fn();
        await refresh();
        await toggleRow(page, 1);
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'multiple', selectedItems: [state.rows[0]] });
        options.selectedItems = [...state.rows];
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'multiple', selectedItems: state.rows });
    });

    it.each(['single', 'multiple'] as const)('should combine a false predicate with disableOnUnselected in %s mode', async (selectionMode) => {
        options.selectionMode = selectionMode;
        options.disableOnUnselected = true;
        options.disabled = () => false;
        await refresh();
        expect(actionButton(page).disabled).to.equal(true);
        await activate(page);
        expect(received).to.have.lengthOf(0);
        if (selectionMode === 'single') await selectRow(page, 0);
        else await toggleRow(page, 0);
        expect(actionButton(page).disabled).to.equal(false);
        await activate(page);
        expect(received).to.have.lengthOf(1);
    });

    it('should allow the predicate to disable an action without disableOnUnselected', async () => {
        options.disabled = () => true;
        await refresh();
        await activate(page);
        expect(actionButton(page).disabled).to.equal(true);
        expect(received).to.have.lengthOf(0);
    });

    it('should refuse dispatch through a disabled adapter even without its button', () => {
        const command = vi.fn();
        const action = adaptMenuItem({ command, disabled: () => true },
            Object.freeze({ selectionMode: 'single', selectedItem: undefined }));
        action.command?.();
        expect(command.mock.calls).to.have.lengthOf(0);
    });

    it('should preserve no-argument commands and boolean disabled', async () => {
        let calls = 0;
        options.command = () => { calls++; };
        options.disabled = true;
        await refresh();
        await activate(page);
        expect(calls).to.equal(0);
        options.disabled = false;
        await refresh();
        await activate(page);
        expect(calls).to.equal(1);
    });

    it('should keep each nested page action scoped to its own selection', async () => {
        const nested = vi.fn();
        options.selection = state.rows[0];
        options.children = menuPage({ selection: state.rows[1], command: nested });
        await refresh();
        await activate(page);
        expect(latest()).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[0] });
        const buttons = page.container.querySelectorAll<HTMLButtonElement>('[data-cratis-component="ActionMenubar"] button');
        buttons[1].click();
        expect(nested.mock.lastCall?.[0]).to.deep.equal({ selectionMode: 'single', selectedItem: state.rows[1] });
    });

    it('should type row fields and narrow selection mode through the public marker', () => {
        const props: MenuItemProps<Person> = {
            command: (selection) => {
                expectTypeOf(selection).toEqualTypeOf<DataPageSelection<Person>>();
                if (selection.selectionMode === 'single') {
                    expectTypeOf(selection.selectedItem?.name).toEqualTypeOf<string | undefined>();
                } else {
                    expectTypeOf(selection.selectedItems).toEqualTypeOf<readonly Person[]>();
                }
            },
            disabled: (selection) => selection.selectionMode === 'multiple' && selection.selectedItems.some((person) => person.id === 1),
        };
        const marker = <DataPage.MenuItem<Person> {...props} />;
        expect(marker.props).to.deep.equal(props);
    });
});
