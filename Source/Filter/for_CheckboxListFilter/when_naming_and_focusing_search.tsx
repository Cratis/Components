// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import { render, stubOptionListLayoutMeasurement, unmount } from './given/a_checkbox_list_filter_in_the_dom';

const options = [{ key: 'a', label: 'Active', value: 'a' }];

describe('when a checkbox list search is shown', () => {
    let mounted: CheckboxListFilterInTheDom;

    afterEach(async () => {
        await unmount(mounted);
    });

    it('should use its explicit accessible name ahead of the placeholder', async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            searchable searchPlaceholder='Placeholder' searchAriaLabel='Find options' />);
        expect(mounted.container.querySelector('input[type="search"]')?.getAttribute('aria-label')).to.equal('Find options');
    });

    it('should fall back to the placeholder', async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            searchable searchPlaceholder='Search options' />);
        expect(mounted.container.querySelector('input[type="search"]')?.getAttribute('aria-label')).to.equal('Search options');
    });

    it('should fall back to English when the placeholder is empty', async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            searchable searchPlaceholder='' />);
        expect(mounted.container.querySelector('input[type="search"]')?.getAttribute('aria-label')).to.equal('Search');
    });
});

describe('when search appears after overflow measurement', () => {
    let mounted: CheckboxListFilterInTheDom;
    let restoreMeasurement: () => void;

    beforeEach(() => {
        restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
    });

    afterEach(async () => {
        await unmount(mounted);
        restoreMeasurement();
    });

    it('should focus the newly created search if requested', async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            autoFocusSearch />);
        expect(document.activeElement).to.equal(mounted.container.querySelector('input[type="search"]'));
    });

    it('should not focus the search by default', async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined} />);
        expect(document.activeElement).not.to.equal(mounted.container.querySelector('input[type="search"]'));
    });
});
