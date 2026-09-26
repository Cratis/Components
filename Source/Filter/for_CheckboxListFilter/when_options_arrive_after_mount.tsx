// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { CheckboxListFilter } from '../CheckboxListFilter';
import type { CheckboxListFilterInTheDom } from './given/a_checkbox_list_filter_in_the_dom';
import { render, unmount } from './given/a_checkbox_list_filter_in_the_dom';

const onToggle = () => undefined;
let mounted: CheckboxListFilterInTheDom;

beforeEach(async () => {
    mounted = await render(<CheckboxListFilter options={[]} selected={new Set()}
        onToggle={onToggle} searchable autoFocusSearch />);
});

afterEach(async () => {
    await unmount(mounted);
});

describe('when options arrive after an empty searchable list mounts', () => {
    beforeEach(async () => {
        await act(async () => mounted.root.render(<CheckboxListFilter
            options={[{ key: 'example', label: 'Example option', value: 'example' }]}
            selected={new Set()} onToggle={onToggle} searchable autoFocusSearch />));
    });

    it('should focus the newly mounted search input', () => {
        expect(document.activeElement).to.equal(mounted.container.querySelector('input[type="search"]'));
    });
});
