// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { Fragment, createElement, type ComponentType } from 'react';
import {
    unstable_defineUiLibrary,
    type unstable_SlotDeclaration,
    type unstable_SlotId,
    type unstable_UiLibrary,
} from '@cratis/components/renderer';
import { unstable_cratisBuiltIn } from '@cratis/components/renderer/builtin';
import { describe, it } from 'vitest';
import { runConformance } from '../src/index.js';

const declaration = (slotId: unstable_SlotId) =>
    unstable_cratisBuiltIn.slots[slotId] as unstable_SlotDeclaration<unstable_SlotId>;

const oneSlot = (
    slotId: unstable_SlotId,
    replacement: unstable_SlotDeclaration<unstable_SlotId>,
    capabilities: unstable_UiLibrary['capabilities'] = [
        'slot.render',
        'parts.passthrough',
    ],
) =>
    unstable_defineUiLibrary({
        id: `broken-${slotId.replace('.', '-')}`,
        displayName: 'Deliberately broken fixture',
        abi: 1,
        level: 'primitive',
        profile: 'broken/v1',
        profileSlots: [slotId],
        capabilities,
        slots: { [slotId]: replacement },
    });

const failureIds = async (
    library: unstable_UiLibrary,
    options: Parameters<typeof runConformance>[1] = {},
) =>
    (await runConformance(library, { document, axe: false, ...options })).checks
        .filter((check) => check.status === 'failed')
        .map((check) => check.id);

describe('when detecting planted adapter defects', () => {
    it('should report a dropped ref on the exact element contract', async () => {
        const original = declaration('common.button');
        // SAFETY: The planted wrapper deliberately erases the known slot props to drop only ref.
        const Original = original.render as unknown as ComponentType<
            Record<string, unknown>
        >;
        const DropRef = (props: Record<string, unknown>) => {
            const { ref: _ref, ...rest } = props;
            return createElement(Original, rest);
        };
        // SAFETY: This deliberate defect preserves the slot signature while removing ref forwarding.
        const dropRefRender = DropRef as typeof original.render;
        const library = oneSlot('common.button', { ...original, render: dropRefRender });

        expect(await failureIds(library)).to.include('contract.common.button.elementRef');
    });

    it('should report an omitted documented part', async () => {
        const library = oneSlot('common.surface', {
            ...declaration('common.surface'),
            render: () => createElement('article', null, 'No stable part'),
        });

        expect(await failureIds(library)).to.include('contract.common.surface.parts');
    });

    it('should report an over-declared capability', async () => {
        const library = oneSlot('common.surface', declaration('common.surface'), [
            'slot.render',
            'parts.passthrough',
            'paging.server',
        ]);

        expect(await failureIds(library)).to.include('manifest.noOverDeclaration');
    });

    it('should reject an undeclared skip', async () => {
        const library = oneSlot('common.button', declaration('common.button'));

        expect(
            await failureIds(library, {
                skips: [{ checkId: 'contract.common.button', slotId: 'common.button' }],
            }),
        ).to.include('skip.contract.common.button.undeclared');
    });

    it('should report duplicate behavior ownership', async () => {
        const original = declaration('dialogs.dialog');
        // SAFETY: The planted wrapper deliberately erases the known slot props to duplicate ownership.
        const Original = original.render as unknown as ComponentType<
            Record<string, unknown>
        >;
        const DuplicateOwner = (props: Record<string, unknown>) =>
            createElement(
                Fragment,
                null,
                createElement(Original, props),
                createElement('section', {
                    role: 'dialog',
                    'aria-label': 'Duplicate owner',
                }),
            );
        // SAFETY: This deliberate defect preserves the slot signature while duplicating ownership.
        const duplicateOwnerRender = DuplicateOwner as typeof original.render;
        const library = oneSlot('dialogs.dialog', {
            ...original,
            render: duplicateOwnerRender,
        });

        expect(await failureIds(library)).to.include('ownership.dialogs.dialog');
    });
});
