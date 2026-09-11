// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { describe, it } from 'vitest';
import { DatePickerInputImplementation } from '../../Common/DatePickerInputImplementation';
import { TooltipImplementation } from '../../Common/TooltipImplementation';
import { TablePaginatorImplementation } from '../../DataTables/TablePaginatorImplementation';
import { DialogImplementation } from '../../Dialogs/DialogImplementation';
import { DropdownImplementation } from '../../Dropdown/DropdownImplementation';
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

    it('should distinguish presentation ownership from atomic ownership', () => {
        for (const slotId of presentationSlots) {
            expect(unstable_coreSlots[slotId]?.mode).to.equal('presentation');
        }
        for (const slotId of atomicSlots) {
            expect(unstable_coreSlots[slotId]?.mode).to.equal('atomic');
        }
    });

    it('should point all five atomic declarations at non-facade Core implementations', () => {
        expect(unstable_coreSlots['common.tooltip']?.render).to.equal(
            TooltipImplementation,
        );
        expect(unstable_coreSlots['dropdown.select']?.render).to.equal(
            DropdownImplementation,
        );
        expect(unstable_coreSlots['dialogs.dialog']?.render).to.equal(
            DialogImplementation,
        );
        expect(unstable_coreSlots['display.datePicker']?.render).to.equal(
            DatePickerInputImplementation,
        );
        expect(unstable_coreSlots['datatables.paginator']?.render).to.equal(
            TablePaginatorImplementation,
        );
    });
});
