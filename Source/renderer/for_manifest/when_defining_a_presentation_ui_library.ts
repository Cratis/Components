// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationSlotMap,
    type CratisPresentationSlots,
    type CratisPresentationUiLibrary,
} from '..';

const declaration = <SlotId extends CratisPresentationSlotId>() => ({
    mode: 'presentation',
    fidelity: 'native',
    render: (() => null) as ComponentType<CratisPresentationSlots[SlotId]>,
}) satisfies CratisPresentationSlotDeclaration<SlotId>;

const validSlots = (): CratisPresentationSlotMap => ({
    'common.button': declaration<'common.button'>(),
    'common.iconButton': declaration<'common.iconButton'>(),
    'common.textInput': declaration<'common.textInput'>(),
    'common.textArea': declaration<'common.textArea'>(),
    'common.checkbox': declaration<'common.checkbox'>(),
    'common.radio': declaration<'common.radio'>(),
    'common.switch': declaration<'common.switch'>(),
    'common.progress': declaration<'common.progress'>(),
    'common.surface': declaration<'common.surface'>(),
});

const validLibrary = (): CratisPresentationUiLibrary => ({
    id: 'sample',
    displayName: 'Sample',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities: ['slot.render', 'parts.passthrough'],
    slots: validSlots(),
});

const defineRuntime = definePresentationUiLibrary as (
    library: unknown,
) => CratisPresentationUiLibrary;

describe('when defining a stable presentation UI library', () => {
    it('should freeze the complete manifest through the shared manifest machinery', () => {
        const input = validLibrary();
        const result = definePresentationUiLibrary(input);

        result.should.not.equal(input);
        result.profile.should.equal(CRATIS_PRESENTATION_PROFILE);
        result.profileSlots.should.deep.equal(cratisPresentationSlotIds);
        Object.isFrozen(result).should.equal(true);
        Object.isFrozen(result.capabilities).should.equal(true);
        Object.isFrozen(result.profileSlots).should.equal(true);
        Object.isFrozen(result.slots).should.equal(true);
        cratisPresentationSlotIds.every((slotId) =>
            Object.isFrozen(result.slots[slotId]),
        ).should.equal(true);
    });

    it('should reject a missing stable slot at runtime', () => {
        const candidate = validLibrary() as unknown as Record<string, unknown>;
        const slots = { ...validSlots() } as Record<string, unknown>;
        Reflect.deleteProperty(slots, 'common.surface');
        candidate.slots = slots;

        (() => defineRuntime(candidate)).should.throw(
            TypeError,
            'exactly the nine stable presentation slots',
        );
    });

    it('should reject an extra slot at runtime', () => {
        const candidate = validLibrary() as unknown as Record<string, unknown>;
        candidate.slots = {
            ...validSlots(),
            'common.tooltip': declaration<'common.button'>(),
        };

        (() => defineRuntime(candidate)).should.throw(
            TypeError,
            'exactly the nine stable presentation slots',
        );
    });

    it('should reject the wrong profile at runtime', () => {
        const candidate = {
            ...validLibrary(),
            profile: 'future-presentation/v2',
        };

        (() => defineRuntime(candidate)).should.throw(
            TypeError,
            `profile must be '${CRATIS_PRESENTATION_PROFILE}'`,
        );
    });

    it('should reject noncanonical profile slots at runtime', () => {
        const candidate = {
            ...validLibrary(),
            profileSlots: cratisPresentationSlotIds.slice(0, -1),
        };

        (() => defineRuntime(candidate)).should.throw(
            TypeError,
            'profileSlots must be the canonical nine-slot profile',
        );
    });

    it('should reject atomic mode at runtime', () => {
        const candidate = validLibrary() as unknown as Record<string, unknown>;
        candidate.slots = {
            ...validSlots(),
            'common.button': {
                ...validSlots()['common.button'],
                mode: 'atomic',
            },
        };

        (() => defineRuntime(candidate)).should.throw(
            TypeError,
            "slot 'common.button' must use presentation mode",
        );
    });

    it('should reject unsupported fidelity at runtime', () => {
        const candidate = validLibrary() as unknown as Record<string, unknown>;
        candidate.slots = {
            ...validSlots(),
            'common.button': {
                ...validSlots()['common.button'],
                fidelity: 'unsupported',
            },
        };

        (() => defineRuntime(candidate)).should.throw(
            TypeError,
            "slot 'common.button' must use native or emulated fidelity",
        );
    });
});
