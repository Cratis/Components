// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type {
    unstable_BehaviorMode,
    unstable_CratisSlots,
    unstable_SlotId,
    unstable_SlotMap,
} from '@cratis/components/renderer';

declare const Button: ComponentType<unstable_CratisSlots['common.button']>;
declare const TextInput: ComponentType<unstable_CratisSlots['common.textInput']>;
declare const Tooltip: ComponentType<unstable_CratisSlots['common.tooltip']>;

const slotId: unstable_SlotId = 'common.button';
const mode: unstable_BehaviorMode = 'presentation';
const slots = {
    'common.button': {
        mode,
        fidelity: 'native',
        render: Button,
    },
    'common.textInput': {
        mode,
        fidelity: 'native',
        render: TextInput,
    },
} satisfies unstable_SlotMap;

// @ts-expect-error Unknown slot identifiers must not enter the Core slot map.
const unknownSlot: unstable_SlotId = 'common.signaturePad';
const wrongProps: unstable_SlotMap = {
    // @ts-expect-error A tooltip implementation cannot satisfy the button prop contract.
    'common.button': { mode: 'presentation', fidelity: 'native', render: Tooltip },
};

void slotId;
void slots;
void unknownSlot;
void wrongProps;
