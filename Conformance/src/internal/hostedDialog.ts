// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement, type ComponentType } from 'react';
import { Dialog, type CratisDialogSlotProps, type DialogProps } from '@cratis/components/Dialogs';
import {
    unstable_CRATIS_UI_ABI_VERSION,
    unstable_RendererScope,
    unstable_defineUiLibrary,
    type unstable_SlotDeclaration,
    type unstable_UiLibrary,
} from '@cratis/components/renderer';

const dialogSlotId = 'dialogs.dialog';

/**
 * Renders one dialog declaration the way an application does: through the public `Dialog` inside a
 * renderer scope that selects it. Components then gives an adapter dialog its host (stack tier,
 * result flow, header and footer actions, overlay container) next to the public props, so the hosted
 * render reads only the public props.
 */
const hostedDialog = (
    declaration: unstable_SlotDeclaration<typeof dialogSlotId>,
): ComponentType<CratisDialogSlotProps> => {
    const library = unstable_defineUiLibrary({
        id: 'conformance-dialog-host',
        displayName: 'Conformance dialog host',
        abi: unstable_CRATIS_UI_ABI_VERSION,
        level: 'primitive',
        profile: 'conformance/dialog-host',
        profileSlots: [],
        capabilities: ['slot.render'],
        slots: { [dialogSlotId]: declaration },
    });
    const HostedDialog = (props: DialogProps) =>
        createElement(unstable_RendererScope, { use: library, children: createElement(Dialog, props) });
    return HostedDialog;
};

/**
 * Returns the library view whose dialog declaration renders through the public `Dialog`, so the
 * dialog checks exercise the same host an application gives the adapter. The declaration keeps its
 * mode and fidelity. A library without a dialog is returned unchanged.
 *
 * @param library Library view the runner exercises.
 * @returns The library view with a hosted dialog declaration.
 */
export const withHostedDialog = (library: unstable_UiLibrary): unstable_UiLibrary => {
    const declaration = library.slots[dialogSlotId];
    if (!declaration) return library;
    const hosted = Object.freeze({ ...declaration, render: hostedDialog(declaration) });
    return { ...library, slots: { ...library.slots, [dialogSlotId]: hosted } };
};
