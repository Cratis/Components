// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import { render, typeIntoSearchInput, unmount } from './given/a_checkbox_list_filter_in_the_dom';

const options = [
    { key: 'engineering', label: 'Engineering', value: 'engineering' },
    { key: 'design', label: 'Design', value: 'design' },
    { key: 'sales', label: 'Sales', value: 'sales' },
];

const optionLabels = (container: HTMLElement) =>
    Array.from(
        container.querySelectorAll('.pv-option-list-options > li:not(.pv-option-list-empty)'),
    ).map((row) => row.querySelector('span')?.textContent);

// `searchable: true` forces the search box on regardless of whether the list overflows, so this
// suite can exercise filtering without needing to fake the browser layout `CheckboxListFilter`
// otherwise relies on to decide that for itself - see `for_CheckboxListFilter/when_options_overflow_the_box`.
describe('when filtering an option list by search text', () => {
    let mounted: CheckboxListFilterInTheDom;

    beforeEach(async () => {
        mounted = await render(
            <CheckboxListFilter
                options={options}
                selected={new Set()}
                searchable
                onToggle={() => undefined}
            />,
        );
    });

    afterEach(async () => {
        await unmount(mounted);
    });

    it('should show every option before any search text is entered', () => {
        expect(optionLabels(mounted.container)).to.deep.equal([
            'Engineering',
            'Design',
            'Sales',
        ]);
    });

    it('should narrow the list to options whose label matches the search text', async () => {
        const input = mounted.container.querySelector(
            '.pv-option-list-search input',
        ) as HTMLInputElement;

        await typeIntoSearchInput(input, 'des');

        expect(optionLabels(mounted.container)).to.deep.equal(['Design']);
    });

    it('should match case-insensitively', async () => {
        const input = mounted.container.querySelector(
            '.pv-option-list-search input',
        ) as HTMLInputElement;

        await typeIntoSearchInput(input, 'ENGIN');

        expect(optionLabels(mounted.container)).to.deep.equal(['Engineering']);
    });

    it('should show a no-matches message when nothing matches', async () => {
        const input = mounted.container.querySelector(
            '.pv-option-list-search input',
        ) as HTMLInputElement;

        await typeIntoSearchInput(input, 'zzz');

        expect(optionLabels(mounted.container)).to.deep.equal([]);
        expect(mounted.container.querySelector('.pv-option-list-empty')).not.to.equal(null);
    });
});
