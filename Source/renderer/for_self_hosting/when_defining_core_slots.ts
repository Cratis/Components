// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { unstable_coreSlots } from '../coreSlots';

const presentationSlots = [
    'common.button',
    'common.iconButton',
    'common.textInput',
    'common.textArea',
    'common.checkbox',
    'common.radio',
    'common.switch',
    'common.progress',
    'common.surface',
] as const;

const atomicSlots = [
    'common.tooltip',
    'dropdown.select',
    'dialogs.dialog',
    'display.datePicker',
    'datatables.paginator',
] as const;

describe('when defining the private Core slot inventory', () => {
    it('should express every current built-in declaration for ABI proof', () => {
        expect(Object.keys(unstable_coreSlots).sort()).to.deep.equal(
            [...presentationSlots, ...atomicSlots].sort(),
        );
    });

    it('should freeze the table and every declaration', () => {
        expect(Object.isFrozen(unstable_coreSlots)).to.equal(true);
        for (const declaration of Object.values(unstable_coreSlots)) {
            expect(Object.isFrozen(declaration)).to.equal(true);
            expect(declaration?.fidelity).to.equal('native');
        }
    });

    it('should distinguish E1 presentation ownership from deferred E2 atomic ownership', () => {
        for (const slotId of presentationSlots) {
            expect(unstable_coreSlots[slotId]?.mode).to.equal('presentation');
        }
        for (const slotId of atomicSlots) {
            expect(unstable_coreSlots[slotId]?.mode).to.equal('atomic');
        }
    });
});
