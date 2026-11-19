// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, type ReactNode } from 'react';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisPresentationCapabilities,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationUiLibrary,
} from '@cratis/components/renderer';
import { MuiButtonSlot, MuiIconButtonSlot } from './button.js';
import { MuiCheckboxSlot, MuiRadioSlot, MuiSwitchSlot } from './choice.js';
import { MuiDialogSlot } from './dialog.js';
import { MuiNumberInputSlot } from './numberInput.js';
import { MuiPaginatorSlot } from './paginator.js';
import { MuiProgressSlot } from './progress.js';
import { MuiSurfaceSlot } from './surface.js';
import { MuiTextAreaSlot, MuiTextInputSlot } from './textFields.js';
import { MuiTooltipSlot } from './tooltip.js';

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] satisfies CratisPresentationCapabilities);

const MuiAdapterProvider = ({ children }: { readonly children: ReactNode }) => {
    const outerTheme = useTheme();
    const theme = useMemo(
        () =>
            outerTheme.vars
                ? outerTheme
                : createTheme({ ...outerTheme, cssVariables: true }),
        [outerTheme],
    );
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const declaration = <SlotId extends CratisPresentationSlotId>(
    render: CratisPresentationSlotDeclaration<SlotId>['render'],
) =>
    Object.freeze({
        mode: 'presentation',
        fidelity: 'native',
        render,
    }) satisfies CratisPresentationSlotDeclaration<SlotId>;

const slots = Object.freeze({
    'common.button': declaration<'common.button'>(MuiButtonSlot),
    'common.iconButton': declaration<'common.iconButton'>(MuiIconButtonSlot),
    'common.textInput': declaration<'common.textInput'>(MuiTextInputSlot),
    'common.textArea': declaration<'common.textArea'>(MuiTextAreaSlot),
    'common.checkbox': declaration<'common.checkbox'>(MuiCheckboxSlot),
    'common.radio': declaration<'common.radio'>(MuiRadioSlot),
    'common.switch': declaration<'common.switch'>(MuiSwitchSlot),
    'common.progress': declaration<'common.progress'>(MuiProgressSlot),
    'common.surface': declaration<'common.surface'>(MuiSurfaceSlot),
});

const atomicSlots = Object.freeze({
    'common.tooltip': Object.freeze({
        mode: 'atomic',
        fidelity: 'native',
        render: MuiTooltipSlot,
    }),
    'common.numberInput': Object.freeze({
        mode: 'atomic',
        fidelity: 'native',
        render: MuiNumberInputSlot,
    }),
    'dialogs.dialog': Object.freeze({
        mode: 'atomic',
        fidelity: 'native',
        render: MuiDialogSlot,
    }),
    'datatables.paginator': Object.freeze({
        mode: 'atomic',
        fidelity: 'native',
        render: MuiPaginatorSlot,
    }),
});

/** Material UI implementation of the stable Cratis presentation profile. */
export const muiUiLibrary: CratisPresentationUiLibrary = definePresentationUiLibrary({
    id: 'cratis-mui',
    displayName: 'Cratis Material UI renderer',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities,
    slots,
    atomicSlots,
    Provider: MuiAdapterProvider,
});
