// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { unmountPrimitive } from '../../../Common/for_Primitives/given/a_primitive_dom';
import {
    filterText,
    focusDropdown,
    isExpanded,
    listbox,
    mountDropdown,
    pressKey,
    selectedState,
    typeIntoFilter,
    type MountedDropdown,
} from './given/a_dropdown';

describe('when committing an option with the keyboard and the list is dismissed instead', () => {
    let mounted: MountedDropdown | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should leave an empty selection alone when Escape dismisses the active option', async () => {
        mounted = await mountDropdown();
        await focusDropdown(mounted);
        await typeIntoFilter(mounted, 'front');
        await pressKey('ArrowDown', mounted.control);
        await pressKey('Escape', mounted.control);

        expect(mounted.changes).to.deep.equal([]);
        expect(filterText(mounted)).to.equal('');
        expect(isExpanded(mounted)).to.equal('false');
        expect(listbox()).to.equal(null);
        expect(selectedState(mounted)).to.equal(null);
    });

    it('should restore the standing selection when Escape dismisses the active option', async () => {
        mounted = await mountDropdown({ initialValue: 'backend' });
        await focusDropdown(mounted);
        expect(filterText(mounted)).to.equal('Backend developer');

        await typeIntoFilter(mounted, 'front');
        await pressKey('ArrowDown', mounted.control);
        await pressKey('Escape', mounted.control);

        expect(mounted.changes).to.deep.equal([]);
        expect(filterText(mounted)).to.equal('Backend developer');
        expect(isExpanded(mounted)).to.equal('false');
        expect(listbox()).to.equal(null);
        expect(selectedState(mounted)).to.equal('true');
    });
});
