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

const options = Array.from({ length: 20 }, (_, index) => ({
    key: `option-${index}`,
    label: `Option ${index}`,
    value: index,
}));

describe('when an option list overflows its box', () => {
    let mounted: CheckboxListFilterInTheDom;
    let restoreMeasurement: () => void;

    beforeEach(async () => {
        // The mirror's measured content (600px) is taller than the box (224px) - it needs to scroll.
        restoreMeasurement = stubOptionListLayoutMeasurement(600, '224px');
        mounted = await render(
            <CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined} />,
        );
    });

    afterEach(async () => {
        await unmount(mounted);
        restoreMeasurement();
    });

    it('should render a search box', () => {
        expect(mounted.container.querySelector('.pv-option-list-search input')).not.to.equal(
            null,
        );
    });

    it('should place the search box as the first child of the scrolling box, so it stays pinned to the top', () => {
        const scrollBox = mounted.container.querySelector('.pv-option-list');
        expect(scrollBox?.firstElementChild?.classList.contains('pv-option-list-search')).to.equal(
            true,
        );
    });

    it('should still render every option', () => {
        expect(
            mounted.container.querySelectorAll('.pv-option-list-options > li'),
        ).to.have.lengthOf(20);
    });
});
