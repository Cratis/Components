// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import {
    render,
    stubOptionListLayoutMeasurement,
    unmount,
} from './given/a_checkbox_list_filter_in_the_dom';

const options = [
    { key: 'active', label: 'Active', value: 'active' },
    { key: 'inactive', label: 'Inactive', value: 'inactive' },
];

describe('when an option list fits inside its box without scrolling', () => {
    let mounted: CheckboxListFilterInTheDom;
    let restoreMeasurement: () => void;

    beforeEach(async () => {
        // The mirror's measured content (100px) is well inside the box (224px) - no scrolling needed.
        restoreMeasurement = stubOptionListLayoutMeasurement(100, '224px');
        mounted = await render(
            <CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined} />,
        );
    });

    afterEach(async () => {
        await unmount(mounted);
        restoreMeasurement();
    });

    it('should not render a search box', () => {
        expect(mounted.container.querySelector('.pv-option-list-search')).to.equal(null);
    });

    it('should still render every option', () => {
        expect(
            mounted.container.querySelectorAll('.pv-option-list-options > li'),
        ).to.have.lengthOf(2);
    });
});
