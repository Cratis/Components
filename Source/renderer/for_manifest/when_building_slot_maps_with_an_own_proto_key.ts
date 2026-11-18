// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import {
    unstable_composeUiLibraries,
    unstable_defineUiLibrary,
    type unstable_SlotMap,
    type unstable_UiLibrary,
} from '..';
import { unstable_createRendererLayer, unstable_createResolvedSlotTable } from '../resolve';
import { buttonSlot, createTestLibrary, FirstButton } from '../for_resolution/testLibrary';

// SAFETY: JSON.parse creates an own `__proto__` data property, as untrusted manifests can.
const protoSlots = JSON.parse(
    '{"__proto__": {"mode": "presentation", "fidelity": "native", "render": {}}}',
) as unstable_SlotMap;

const libraryWithProtoKey = (): unstable_UiLibrary =>
    unstable_defineUiLibrary({
        id: 'proto',
        displayName: 'Proto',
        abi: 1,
        level: 'primitive',
        profile: 'test-controls/v1',
        capabilities: ['slot.render'],
        slots: { ...buttonSlot(FirstButton), ...protoSlots },
    });

const expectPlainOwnProtoKey = (slots: object) => {
    expect(Object.getPrototypeOf(slots)).to.equal(Object.prototype);
    expect(Object.keys(slots)).to.include('__proto__');
};

describe('when building slot maps with an own __proto__ key', () => {
    it('should keep the defined slot map prototype unchanged', () => {
        expectPlainOwnProtoKey(libraryWithProtoKey().slots);
    });

    it('should keep the composed slot map prototype unchanged', () => {
        const composed = unstable_composeUiLibraries(
            createTestLibrary('first', buttonSlot(FirstButton)),
            libraryWithProtoKey(),
        );

        expectPlainOwnProtoKey(composed.slots);
    });

    it('should keep the resolved slot table prototype unchanged', () => {
        const table = unstable_createResolvedSlotTable([
            unstable_createRendererLayer(libraryWithProtoKey()),
        ]);

        expectPlainOwnProtoKey(table);
    });
});
