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

describe('when committing an option with the keyboard and the consumer does not take the value back', () => {
    let mounted: MountedDropdown | undefined;

    afterEach(async () => {
        if (mounted) await unmountPrimitive(mounted);
        mounted = undefined;
    });

    it('should still commit, close and show the label when no value prop answers', async () => {
        mounted = await mountDropdown({ binding: 'never answers' });
        await focusDropdown(mounted);
        await typeIntoFilter(mounted, 'front');
        await pressKey('ArrowDown', mounted.control);
        await pressKey('Enter', mounted.control);

        expect(mounted.changes).to.deep.equal(['frontend']);
        expect(filterText(mounted)).to.equal('Frontend developer');
        expect(isExpanded(mounted)).to.equal('false');
        expect(listbox()).to.equal(null);
        expect(selectedState(mounted)).to.equal('true');
    });

    it('should let a later value from the consumer win over what was committed', async () => {
        mounted = await mountDropdown({ binding: 'rewrites' });
        await focusDropdown(mounted);
        await typeIntoFilter(mounted, 'front');
        await pressKey('ArrowDown', mounted.control);
        await pressKey('Enter', mounted.control);

        // The consumer answered with a value no option carries, so nothing is selected - but the
        // overlay is the Dropdown's to close, and the stale filter text is never left behind.
        expect(mounted.changes).to.deep.equal(['frontend']);
        expect(filterText(mounted)).to.equal('');
        expect(isExpanded(mounted)).to.equal('false');
        expect(listbox()).to.equal(null);
        expect(selectedState(mounted)).to.equal(null);
    });
});
