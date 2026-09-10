// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import { render, unmount } from './given/a_checkbox_list_filter_in_the_dom';

const options = [
    { key: 'active', label: 'Active', value: 'active' },
    { key: 'inactive', label: 'Inactive', value: 'inactive' },
];

const inputFor = (container: HTMLElement, key: string) =>
    container.querySelectorAll('.pv-option-list-options > li')[
        options.findIndex((option) => option.key === key)
    ]?.querySelector('input') as HTMLInputElement;

describe('when toggling option selection in a multi-select checkbox list', () => {
    let mounted: CheckboxListFilterInTheDom;
    let toggled: string[];

    afterEach(async () => {
        await unmount(mounted);
    });

    const renderMulti = async (selected: Set<string>) => {
        toggled = [];
        mounted = await render(
            <CheckboxListFilter
                options={options}
                selected={selected}
                multi
                onToggle={(key) => toggled.push(key)}
            />,
        );
    };

    it('should render checkboxes', async () => {
        await renderMulti(new Set());

        expect(inputFor(mounted.container, 'active').type).to.equal('checkbox');
    });

    it('should check the input for a selected option', async () => {
        await renderMulti(new Set(['active']));

        expect(inputFor(mounted.container, 'active').checked).to.equal(true);
        expect(inputFor(mounted.container, 'inactive').checked).to.equal(false);
    });

    it('should expose data-selected only on the selected row', async () => {
        await renderMulti(new Set(['active']));

        const rows = mounted.container.querySelectorAll('.pv-option-list-options > li');
        expect(rows[0].getAttribute('data-selected')).to.equal('true');
        expect(rows[1].hasAttribute('data-selected')).to.equal(false);
    });

    it('should call onToggle with the toggled option key', async () => {
        await renderMulti(new Set());

        await act(async () => {
            inputFor(mounted.container, 'inactive').click();
        });

        expect(toggled).to.deep.equal(['inactive']);
    });
});

describe('when toggling option selection in a single-select radio list', () => {
    let mounted: CheckboxListFilterInTheDom;

    afterEach(async () => {
        await unmount(mounted);
    });

    it('should render radio buttons grouped under one name', async () => {
        mounted = await render(
            <CheckboxListFilter options={options} selected={new Set()} onToggle={() => undefined} />,
        );

        const active = inputFor(mounted.container, 'active');
        const inactive = inputFor(mounted.container, 'inactive');

        expect(active.type).to.equal('radio');
        expect(active.name).not.to.equal('');
        expect(active.name).to.equal(inactive.name);
    });
});
