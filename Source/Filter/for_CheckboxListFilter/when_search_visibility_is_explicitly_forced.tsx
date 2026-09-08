// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import {
    render,
    stubOptionListLayoutMeasurement,
    unmount,
} from './given/a_checkbox_list_filter_in_the_dom';

const fewOptions = [
    { key: 'active', label: 'Active', value: 'active' },
    { key: 'inactive', label: 'Inactive', value: 'inactive' },
];

const manyOptions = Array.from({ length: 20 }, (_, index) => ({
    key: `option-${index}`,
    label: `Option ${index}`,
    value: index,
}));

// `searchable` is a tri-state: `undefined` decides automatically (covered by
// `when_options_fit_without_scrolling` and `when_options_overflow_the_box`), while `true`/`false`
// override that decision explicitly, the same way the pre-existing FilterDefinition contract did.
describe('when a caller forces search visibility explicitly', () => {
    let mounted: CheckboxListFilterInTheDom;
    let restoreMeasurement: (() => void) | undefined;

    afterEach(async () => {
        await unmount(mounted);
        restoreMeasurement?.();
        restoreMeasurement = undefined;
    });

    it('should show the search box for a short list when searchable is true', async () => {
        mounted = await render(
            <CheckboxListFilter
                options={fewOptions}
                selected={new Set()}
                searchable
                onToggle={() => undefined}
            />,
        );

        expect(mounted.container.querySelector('.pv-option-list-search')).not.to.equal(null);
    });

    it('should hide the search box for an overflowing list when searchable is false', async () => {
        restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
        mounted = await render(
            <CheckboxListFilter
                options={manyOptions}
                selected={new Set()}
                searchable={false}
                onToggle={() => undefined}
            />,
        );

        expect(mounted.container.querySelector('.pv-option-list-search')).to.equal(null);
    });

    it('should not render the measuring mirror when search visibility is forced', async () => {
        mounted = await render(
            <CheckboxListFilter
                options={manyOptions}
                selected={new Set()}
                searchable={false}
                onToggle={() => undefined}
            />,
        );

        expect(mounted.container.querySelector('.pv-option-list-mirror')).to.equal(null);
    });
});
