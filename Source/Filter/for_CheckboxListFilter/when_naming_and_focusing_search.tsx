// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import { render, stubOptionListLayoutMeasurement, unmount } from './given/a_checkbox_list_filter_in_the_dom';

const options = [{ key: 'a', label: 'Active', value: 'a' }];
let mounted: CheckboxListFilterInTheDom;

afterEach(async () => {
    await unmount(mounted);
});

describe('when naming a checkbox list search explicitly', () => {
    beforeEach(async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            searchable searchPlaceholder='Placeholder' searchAriaLabel='Find options' />);
    });

    it('should use its accessible name ahead of the placeholder', () => {
        expect(mounted.container.querySelector('input[type="search"]')?.getAttribute('aria-label')).to.equal('Find options');
    });
});

describe('when naming a checkbox list search from its placeholder', () => {
    beforeEach(async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            searchable searchPlaceholder='Search options' />);
    });

    it('should use the placeholder', () => {
        expect(mounted.container.querySelector('input[type="search"]')?.getAttribute('aria-label')).to.equal('Search options');
    });
});

describe('when a checkbox list search placeholder is empty', () => {
    beforeEach(async () => {
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            searchable searchPlaceholder='' />);
    });

    it('should use the English fallback', () => {
        expect(mounted.container.querySelector('input[type="search"]')?.getAttribute('aria-label')).to.equal('Search');
    });
});

describe('when search appears after overflow measurement with autoFocus requested', () => {
    let restoreMeasurement: () => void;

    beforeEach(async () => {
        restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined}
            autoFocusSearch />);
    });

    afterEach(() => restoreMeasurement());

    it('should focus the newly created search', () => {
        expect(document.activeElement).to.equal(mounted.container.querySelector('input[type="search"]'));
    });
});

describe('when search appears after overflow measurement without autoFocus', () => {
    let restoreMeasurement: () => void;

    beforeEach(async () => {
        restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
        mounted = await render(<CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined} />);
    });

    afterEach(() => restoreMeasurement());

    it('should not focus the search', () => {
        expect(document.activeElement).not.to.equal(mounted.container.querySelector('input[type="search"]'));
    });
});
