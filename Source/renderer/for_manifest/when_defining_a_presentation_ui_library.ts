// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import { expect } from 'chai';
import { describe, it } from 'vitest';
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

const declaration = <SlotId extends CratisPresentationSlotId>() =>
    ({
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
    capabilities: ['slot.render', 'parts.passthrough', 'ssr.staticRender'],
    slots: validSlots(),
});

const defineRuntime = definePresentationUiLibrary as (
    library: unknown,
) => CratisPresentationUiLibrary;

const mutableLibrary = (): Record<string, unknown> => {
    // SAFETY: runtime validation specs deliberately bypass the compile-time contract to exercise
    // malformed JavaScript inputs without weakening the production helper's public type.
    return validLibrary() as unknown as Record<string, unknown>;
};

describe('when defining a stable presentation UI library', () => {
    it('should freeze a defensive copy of the complete stable manifest', () => {
        const input = validLibrary();
        const result = definePresentationUiLibrary(input);

        expect(result).not.to.equal(input);
        expect(result.profile).to.equal(CRATIS_PRESENTATION_PROFILE);
        expect(result.profileSlots).to.deep.equal(cratisPresentationSlotIds);
        expect(Object.isFrozen(result)).to.equal(true);
        expect(Object.isFrozen(result.capabilities)).to.equal(true);
        expect(Object.isFrozen(result.profileSlots)).to.equal(true);
        expect(Object.isFrozen(result.slots)).to.equal(true);
        expect(
            cratisPresentationSlotIds.every((slotId) =>
                Object.isFrozen(result.slots[slotId]),
            ),
        ).to.equal(true);
    });

    it('should reject a missing stable slot at runtime', () => {
        const candidate = mutableLibrary();
        const slots = { ...validSlots() } as Record<string, unknown>;
        Reflect.deleteProperty(slots, 'common.surface');
        candidate.slots = slots;

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'exactly the nine stable presentation slots',
        );
    });

    it('should reject an extra slot at runtime', () => {
        const candidate = mutableLibrary();
        candidate.slots = {
            ...validSlots(),
            'common.tooltip': declaration<'common.button'>(),
        };

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'exactly the nine stable presentation slots',
        );
    });

    it('should reject a non-object manifest at runtime', () => {
        expect(() => defineRuntime(null)).to.throw(
            TypeError,
            'manifest must be an object',
        );
    });

    it('should reject an invalid stable renderer identity at runtime', () => {
        const candidate = mutableLibrary();
        candidate.id = '../unstable';

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'id must be a valid package-local renderer identity',
        );
    });

    it('should reject an invalid stable display name at runtime', () => {
        const candidate = mutableLibrary();
        candidate.displayName = '';

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'displayName must contain between 1 and 128 characters',
        );
    });

    it('should reject a whitespace-only stable display name at runtime', () => {
        const candidate = mutableLibrary();
        candidate.displayName = '   ';

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'displayName must contain between 1 and 128 characters',
        );
    });

    it('should reject a non-component stable provider at runtime', () => {
        const candidate = mutableLibrary();
        candidate.Provider = {};

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'Provider must be a React component when supplied',
        );
    });

    it('should reject the wrong profile at runtime', () => {
        const candidate = {
            ...validLibrary(),
            profile: 'future-presentation/v2',
        };

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            `profile must be '${CRATIS_PRESENTATION_PROFILE}'`,
        );
    });

    it('should reject noncanonical profile slots at runtime', () => {
        const candidate = {
            ...validLibrary(),
            profileSlots: cratisPresentationSlotIds.slice(0, -1),
        };

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'profileSlots must be the canonical nine-slot profile',
        );
    });

    it('should reject atomic mode at runtime', () => {
        const candidate = mutableLibrary();
        candidate.slots = {
            ...validSlots(),
            'common.button': {
                ...validSlots()['common.button'],
                mode: 'atomic',
            },
        };

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            "slot 'common.button' must use presentation mode",
        );
    });

    it('should reject unsupported fidelity at runtime', () => {
        const candidate = mutableLibrary();
        candidate.slots = {
            ...validSlots(),
            'common.button': {
                ...validSlots()['common.button'],
                fidelity: 'unsupported',
            },
        };

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            "slot 'common.button' must use native or emulated fidelity",
        );
    });

    it('should reject a missing required presentation capability at runtime', () => {
        const candidate = mutableLibrary();
        candidate.capabilities = ['slot.render', 'parts.passthrough'];

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'capabilities must begin with slot.render, parts.passthrough, and ssr.staticRender',
        );
    });

    it('should reject duplicate capabilities at runtime', () => {
        const candidate = mutableLibrary();
        candidate.capabilities = [
            'slot.render',
            'parts.passthrough',
            'ssr.staticRender',
            'slot.render',
        ];

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'capabilities must not contain duplicates',
        );
    });

    it('should reject required capabilities outside their stable tuple positions', () => {
        const candidate = mutableLibrary();
        candidate.capabilities = [
            'parts.passthrough',
            'slot.render',
            'ssr.staticRender',
        ];

        expect(() => defineRuntime(candidate)).to.throw(
            TypeError,
            'capabilities must begin with slot.render, parts.passthrough, and ssr.staticRender',
        );
    });

    it('should not preserve unstable manifest fields on the stable result', () => {
        const candidate = mutableLibrary();
        candidate.preflight = () => [];

        const result = defineRuntime(candidate);

        expect('preflight' in result).to.equal(false);
    });
});
