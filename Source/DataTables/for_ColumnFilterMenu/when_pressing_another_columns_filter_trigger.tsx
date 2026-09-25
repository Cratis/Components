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
 * Presses a button the way a browser does, up to and including the pointer release: the pointer
 * sequence, with the focus a real `mousedown` performs as its default action wedged into the middle
 * of it. jsdom dispatches the events but never runs that default action, so the focus move has to be
 * explicit here - without it this would not be the scenario a user actually produces.
 *
 * The open menu contains focus, so the focus move is pulled back into it, and the pointer release
 * dismisses the menu as an interaction outside it. The `click` that follows is deliberately not
 * dispatched: in a browser it lands on the modal popover's underlay and opens nothing, while jsdom
 * has no hit testing and would deliver it to the trigger, opening a menu a user never sees.
 */
const pressButton = async (button: HTMLButtonElement) => {
    await act(async () => {
        button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
        button.focus();
        button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    });
    await settleDeferredFocusRestore();
};

/**
 * Opens the menu and lets React Aria's deferred autofocus place focus inside it, the state a user is
 * in by the time they reach for another control. Opening without settling left it to timing whether
 * focus was still on the trigger or already in the menu, and the two states dismiss differently.
 */
const openMenuWithFocusInside = async (table: FilterableTableInTheDom, trigger: HTMLButtonElement) => {
    await act(async () => trigger.focus());
    const menu = await openFilterMenu(table, trigger);
    await settleDeferredFocusRestore();
    if (!menu.contains(document.activeElement)) {
        throw new Error('The opened ColumnFilterMenu did not take focus.');
    }
    return menu;
};

describe('when pressing another column filter trigger while a column filter menu has focus', () => {
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

        dismissedMenu = await openMenuWithFocusInside(table, dismissedTrigger);
        await pressButton(pressedTrigger);
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
        await settleDeferredFocusRestore();
    });

    it('should dismiss the open menu', () => {
        expect(document.body.contains(dismissedMenu)).to.equal(false);
    });

    it('should return focus to the trigger whose menu was dismissed', () => {
        expect(document.activeElement).to.equal(dismissedTrigger);
    });

    it('should not leave focus on the pressed trigger, which the open menu kept focus away from', () => {
        expect(document.activeElement).to.not.equal(pressedTrigger);
    });
});
