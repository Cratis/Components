// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { expect } from 'chai';
import { afterEach, describe, it } from 'vitest';
import { useTagOccurrences } from '../tagOccurrences';
import { mountPrimitive, unmountPrimitive, type MountedPrimitive } from '../for_Primitives/given/a_primitive_dom';

describe('when removing occurrence keys', () => {
    let mounted: MountedPrimitive;
    let occurrences: ReturnType<typeof useTagOccurrences>;
    const changes: string[][] = [];
    const Harness = ({ accept = true }: { accept?: boolean }) => {
        const [value, setValue] = useState(['alpha', 'alpha', 'beta', 'alpha']);
        occurrences = useTagOccurrences(value, (next) => {
            changes.push(next);
            if (accept) setValue(next);
        });
        return null;
    };

    afterEach(async () => {
        await unmountPrimitive(mounted);
        changes.length = 0;
    });

    it('should remove exactly the requested key set in one ordered callback', async () => {
        mounted = await mountPrimitive(<Harness />);
        const [first, second, third, last] = occurrences!.items;
        await act(async () => occurrences.remove(new Set([first.id, third.id])));
        expect(changes).to.deep.equal([['alpha', 'alpha']]);
        expect(occurrences!.items).to.deep.equal([second, last]);
    });

    it('should remove the last equal occurrence without changing earlier identities', async () => {
        mounted = await mountPrimitive(<Harness />);
        const previous = occurrences!.items;
        await act(async () => occurrences.remove(new Set([previous[3].id])));
        expect(changes).to.deep.equal([['alpha', 'alpha', 'beta']]);
        expect(occurrences!.items).to.deep.equal(previous.slice(0, 3));
    });

    it('should keep all occurrences visible when the controlled owner refuses the change', async () => {
        mounted = await mountPrimitive(<Harness accept={false} />);
        const previous = occurrences!.items;
        await act(async () => occurrences.remove(new Set([previous[0].id])));
        expect(changes).to.deep.equal([['alpha', 'beta', 'alpha']]);
        expect(occurrences!.items).to.deep.equal(previous);
    });
});
