// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisAtomicSlotMap,
    type CratisPresentationCapabilities,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationUiLibrary,
} from '@cratis/components/renderer';
import { DesignsystemetButtonSlot, DesignsystemetIconButtonSlot } from './button.js';
import {
    DesignsystemetCheckboxSlot,
    DesignsystemetRadioSlot,
    DesignsystemetSwitchSlot,
} from './choice.js';
import { DesignsystemetDialogSlot } from './dialog.js';
import { DesignsystemetTooltipSlot } from './tooltip.js';
import { DesignsystemetPaginatorSlot } from './paginator.js';
import { DesignsystemetProgressSlot, DesignsystemetSurfaceSlot } from './display.js';
import {
    DesignsystemetNumberInputSlot,
    DesignsystemetTextAreaSlot,
    DesignsystemetTextInputSlot,
} from './fields.js';

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] satisfies CratisPresentationCapabilities);

const declaration = <SlotId extends CratisPresentationSlotId>(
    render: CratisPresentationSlotDeclaration<SlotId>['render'],
) =>
    Object.freeze({
        mode: 'presentation',
        fidelity: 'native',
        render,
    }) satisfies CratisPresentationSlotDeclaration<SlotId>;

const slots = Object.freeze({
    'common.button': declaration<'common.button'>(DesignsystemetButtonSlot),
    'common.iconButton': declaration<'common.iconButton'>(DesignsystemetIconButtonSlot),
    'common.textInput': declaration<'common.textInput'>(DesignsystemetTextInputSlot),
    'common.textArea': declaration<'common.textArea'>(DesignsystemetTextAreaSlot),
    'common.checkbox': declaration<'common.checkbox'>(DesignsystemetCheckboxSlot),
    'common.radio': declaration<'common.radio'>(DesignsystemetRadioSlot),
    'common.switch': declaration<'common.switch'>(DesignsystemetSwitchSlot),
    'common.progress': declaration<'common.progress'>(DesignsystemetProgressSlot),
    'common.surface': declaration<'common.surface'>(DesignsystemetSurfaceSlot),
});

// Atomic slots Designsystemet implements natively; every other atomic slot keeps the built-in
// Components implementation.
const atomicSlots = Object.freeze({
    'dialogs.dialog': Object.freeze({ mode: 'atomic', fidelity: 'native', render: DesignsystemetDialogSlot }),
    'common.numberInput': Object.freeze({ mode: 'atomic', fidelity: 'native', render: DesignsystemetNumberInputSlot }),
    'common.tooltip': Object.freeze({ mode: 'atomic', fidelity: 'native', render: DesignsystemetTooltipSlot }),
    'datatables.paginator': Object.freeze({ mode: 'atomic', fidelity: 'native', render: DesignsystemetPaginatorSlot }),
}) satisfies CratisAtomicSlotMap;

/** Digdir Designsystemet implementation of the stable Cratis presentation profile. */
export const designsystemetUiLibrary: CratisPresentationUiLibrary = definePresentationUiLibrary({
    id: 'cratis-designsystemet',
    displayName: 'Cratis Designsystemet renderer',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities,
    slots,
    atomicSlots,
});
