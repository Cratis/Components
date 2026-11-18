// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { definePresentationUiLibrary, unstable_composeUiLibraries } from '..';
import { unstable_createRendererLayer } from '../resolve';
import {
    aStablePresentationLibrary,
    paginatorAtomicSlots,
} from '../for_self_hosting/given/a_stable_presentation_library';
import { buttonSlot, createTestLibrary, FirstButton } from './testLibrary';

describe('when creating renderer layers without atomic slots', () => {
    it('should resolve a stable library to exactly its nine presentation slots', () => {
        const library = definePresentationUiLibrary(aStablePresentationLibrary());

        expect(unstable_createRendererLayer(library).slots).to.deep.equal({ ...library.slots });
    });

    it('should resolve a generic library to exactly its own slots', () => {
        const library = createTestLibrary('generic', buttonSlot(FirstButton));

        expect(unstable_createRendererLayer(library).slots).to.deep.equal({ ...library.slots });
    });

    it('should ignore an atomic slots field on a library outside the stable profile', () => {
        const library = createTestLibrary('generic', buttonSlot(FirstButton), {
            ...({ atomicSlots: paginatorAtomicSlots() } as object),
        });

        expect(unstable_createRendererLayer(library).slots).to.deep.equal({ ...library.slots });
    });

    it('should compose stable libraries without atomic slots exactly as before', () => {
        const stable = definePresentationUiLibrary(aStablePresentationLibrary());
        const generic = createTestLibrary('generic', buttonSlot(FirstButton));

        expect(unstable_composeUiLibraries(stable, generic).slots).to.deep.equal({
            ...stable.slots,
            ...generic.slots,
        });
    });
});
