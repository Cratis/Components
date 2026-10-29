// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { should } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import {
    render,
    stubOptionListLayoutMeasurement,
    unmount,
} from './given/a_checkbox_list_filter_in_the_dom';

should();

const onToggle = () => undefined;

const scenarios = [
    {
        condition: 'overflow the box',
        optionCount: 20,
        mirrorScrollHeight: 600,
        showSearch: true,
        assertion: 'should show search when the options overflow',
    },
    {
        condition: 'fit inside the box',
        optionCount: 2,
        mirrorScrollHeight: 100,
        showSearch: false,
        assertion: 'should not show search when the options fit',
    },
];

describe.each(scenarios)('when options arrive after an empty auto-detecting list mounts and they $condition', scenario => {
    let mounted: CheckboxListFilterInTheDom;
    let restoreMeasurement: () => void;

    beforeEach(async () => {
        restoreMeasurement = stubOptionListLayoutMeasurement(scenario.mirrorScrollHeight, '224px');
        mounted = await render(
            <CheckboxListFilter options={[]} selected={new Set()} onToggle={onToggle} />,
        );

        const options = Array.from({ length: scenario.optionCount }, (_, index) => ({
            key: `option-${index}`,
            label: `Option ${index}`,
            value: index,
        }));
        await act(async () => {
            mounted.root.render(
                <CheckboxListFilter options={options} selected={new Set()} onToggle={onToggle} />,
            );
        });
    });

    afterEach(async () => {
        await unmount(mounted);
        restoreMeasurement();
    });

    it(scenario.assertion, () => {
        Boolean(mounted.container.querySelector('input[type="search"]')).should.equal(scenario.showSearch);
    });
});
