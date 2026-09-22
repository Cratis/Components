// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { unmountPrimitive } from '../../../Common/for_Primitives/given/a_primitive_dom';
import {
    isExpanded,
    listbox,
    mountDropdown,
    options,
    pressKey,
    selectedState,
    type DropdownBinding,
    type MountedDropdown,
} from './given/a_dropdown';

const bindings: DropdownBinding[] = ['accepts', 'never answers'];

describe('when committing an option with the keyboard and no filter is in play', () => {
    let mounted: MountedDropdown | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    for (const binding of bindings) {
        it(`should open on ArrowDown and commit the active option with Enter when the consumer ${binding} the value`, async () => {
            mounted = await mountDropdown({ filter: false, binding });
            expect(mounted.control.textContent).to.contain('Select a role');

            await pressKey('ArrowDown', mounted.control);
            expect(options().map((option) => option.textContent)).to.deep.equal([
                'Backend developer',
                'Frontend developer',
                'Designer',
            ]);

            await pressKey('ArrowDown');
            await pressKey('Enter');

            expect(mounted.changes).to.deep.equal(['frontend']);
            expect(mounted.control.textContent).to.contain('Frontend developer');
            expect(isExpanded(mounted)).to.equal('false');
            expect(listbox()).to.equal(null);
            expect(selectedState(mounted)).to.equal('true');
        });
    }

    it('should leave the selection alone when Escape dismisses the list', async () => {
        mounted = await mountDropdown({ filter: false });
        await pressKey('ArrowDown', mounted.control);
        await pressKey('Escape');

        expect(mounted.changes).to.deep.equal([]);
        expect(mounted.control.textContent).to.contain('Select a role');
        expect(isExpanded(mounted)).to.equal('false');
        expect(listbox()).to.equal(null);
        expect(selectedState(mounted)).to.equal(null);
    });
});
