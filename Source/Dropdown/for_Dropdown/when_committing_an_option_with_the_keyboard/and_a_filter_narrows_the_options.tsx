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
    options,
    pressKey,
    selectedState,
    typeIntoFilter,
    type DropdownBinding,
    type MountedDropdown,
} from './given/a_dropdown';

// The keyboard owes the same finished commit whether or not the consuming application feeds the
// emitted value straight back, so every arrow-key case runs against both bindings.
const bindings: DropdownBinding[] = ['accepts', 'never answers'];

describe('when committing an option with the keyboard and a filter narrows the options', () => {
    let mounted: MountedDropdown | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    for (const binding of bindings) {
        it(`should commit the option ArrowDown made active when the consumer ${binding} the value`, async () => {
            mounted = await mountDropdown({ binding });
            await focusDropdown(mounted);
            await typeIntoFilter(mounted, 'front');

            expect(options().map((option) => option.textContent)).to.deep.equal([
                'Frontend developer',
            ]);

            await pressKey('ArrowDown', mounted.control);
            expect(mounted.control.getAttribute('aria-activedescendant')).to.equal(
                options()[0].id,
            );

            await pressKey('Enter', mounted.control);

            expect(mounted.changes).to.deep.equal(['frontend']);
            expect(filterText(mounted)).to.equal('Frontend developer');
            expect(isExpanded(mounted)).to.equal('false');
            expect(listbox()).to.equal(null);
            expect(selectedState(mounted)).to.equal('true');
        });

        it(`should commit the option ArrowUp made active when the consumer ${binding} the value`, async () => {
            mounted = await mountDropdown({ binding });
            await focusDropdown(mounted);
            await typeIntoFilter(mounted, 'developer');

            expect(options().map((option) => option.textContent)).to.deep.equal([
                'Backend developer',
                'Frontend developer',
            ]);

            await pressKey('ArrowUp', mounted.control);
            expect(mounted.control.getAttribute('aria-activedescendant')).to.equal(
                options()[1].id,
            );

            await pressKey('Enter', mounted.control);

            expect(mounted.changes).to.deep.equal(['frontend']);
            expect(filterText(mounted)).to.equal('Frontend developer');
            expect(isExpanded(mounted)).to.equal('false');
            expect(listbox()).to.equal(null);
            expect(selectedState(mounted)).to.equal('true');
        });
    }

    it('should report the committed value exactly once', async () => {
        mounted = await mountDropdown();
        await focusDropdown(mounted);
        await typeIntoFilter(mounted, 'design');
        await pressKey('ArrowDown', mounted.control);
        await pressKey('Enter', mounted.control);

        expect(mounted.changes).to.deep.equal(['designer']);
    });
});
