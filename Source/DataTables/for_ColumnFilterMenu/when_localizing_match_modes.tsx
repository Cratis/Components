// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it } from 'vitest';
import {
    type FilterableTableInTheDom,
    openFilterMenu,
    renderFilterableTable,
    unmountFilterableTable,
} from './given/a_filterable_table';

describe('when localizing match modes', () => {
    let table: FilterableTableInTheDom;
    let modeLabels: string[];

    beforeEach(async () => {
        table = await renderFilterableTable({
            column: {
                field: 'score',
                header: 'Score',
                filter: true,
                dataType: 'numeric',
                showFilterMatchModes: true,
                filterLabels: {
                    matchModeAriaLabel: 'Comparison',
                    matchModeLabel: (_mode, defaultLabel) => `Localized ${defaultLabel}`,
                },
            },
        });
        const menu = await openFilterMenu(table);
        const matchMode = menu.querySelector<HTMLButtonElement>(
            '.cratis-dropdown__trigger',
        );
        if (!document.querySelector('[aria-label="Comparison"]')) {
            throw new Error('Match-mode selector was not accessibly named.');
        }
        if (!matchMode) throw new Error('Match-mode selector was not rendered.');
        await act(async () => matchMode.click());
        modeLabels = Array.from(
            document.querySelectorAll('[data-cratis-part="option"]'),
            (option) => option.textContent ?? '',
        );
    });

    afterEach(async () => {
        await unmountFilterableTable(table);
    });

    it('should localize every built-in mode', () => {
        expect(modeLabels.length).to.be.greaterThan(0);
        expect(modeLabels.every((label) => label.startsWith('Localized '))).to.equal(
            true,
        );
    });
});
