// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import type { ColumnProps } from '../Column';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

const firstFilterColumn: ColumnProps = {
    field: 'role',
    header: 'Role',
    filter: true,
    dataType: 'text',
    showFilterMatchModes: false,
};

const secondFilterColumn: ColumnProps = {
    field: 'roleCode',
    header: 'Role code',
    filter: true,
    dataType: 'text',
    showFilterMatchModes: false,
};

/**
 * Lets React Aria's own `requestAnimationFrame`-deferred focus restore run to completion, so the
 * assertions describe where focus settles rather than a half-finished frame - and so one scenario
 * never leaves deferred work behind to disturb the next one.
 */
const settleDeferredFocusRestore = async () => {
    await act(async () => {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    });
};

/**
 * Presses a button the way a browser does: the pointer sequence, with the focus a real `mousedown`
 * performs as its default action wedged into the middle of it. jsdom dispatches the events but never
 * runs that default action, so the focus move has to be explicit here - without it this would not be
 * the scenario a user actually produces.
 */
const pressButton = async (button: HTMLButtonElement) => {
    await act(async () => {
        button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
        button.focus();
        button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    });
    await act(async () => {
        button.dispatchEvent(new PointerEvent('click', { bubbles: true, button: 0 }));
    });
    await settleDeferredFocusRestore();
};

describe('when dismissing one column filter by moving focus to another column filter trigger', () => {
    let table: FilterableTableInTheDom;
    let dismissedTrigger: HTMLButtonElement;
    let pressedTrigger: HTMLButtonElement;
    let dismissedMenu: HTMLElement;

    beforeEach(async () => {
        table = await renderFilterableTable({
            column: firstFilterColumn,
            additionalColumns: [secondFilterColumn],
        });
        [dismissedTrigger, pressedTrigger] = table.triggers;

        await act(async () => dismissedTrigger.focus());
        dismissedMenu = await openFilterMenu(table, dismissedTrigger);
        await pressButton(pressedTrigger);
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
        await settleDeferredFocusRestore();
    });

    it('should dismiss the open menu', () => {
        expect(document.body.contains(dismissedMenu)).to.equal(false);
    });

    it('should leave focus on the control the user moved to', () => {
        expect(document.activeElement).to.equal(pressedTrigger);
    });

    it('should not pull focus back to the trigger whose menu was dismissed', () => {
        expect(document.activeElement).to.not.equal(dismissedTrigger);
    });
});
