// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useContext } from 'react';
import { PrimeReactContext } from '@primereact/core/config';
import { PrimeButtonSlot, PrimeIconButtonSlot } from './button.js';
import { PrimeCheckboxSlot, PrimeRadioSlot, PrimeSwitchSlot } from './choice.js';
import { PrimeDialogSlot } from './dialog.js';
import { PrimePaginatorSlot } from './paginator.js';
import { PrimeProgressSlot } from './progress.js';
import { PrimeSurfaceSlot } from './surface.js';
import { PrimeTextAreaSlot, PrimeTextInputSlot } from './textFields.js';
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type CratisPresentationCapabilities,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationUiLibrary,
    type CratisPresentationUiLibraryProviderProps,
} from '@cratis/components/renderer';

declare module '@cratis/components/renderer' {
    interface CratisRendererSetupExtensions {
        /** Application attests that its outer PrimeReactProvider received a license key. */
        'cratis-primereact.license-configured': boolean;
    }
}

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] satisfies CratisPresentationCapabilities);

const licenseConfiguredAttestation = 'cratis-primereact.license-configured';

const PrimeReactAdapterProvider = ({
    children,
    setup,
}: CratisPresentationUiLibraryProviderProps) => {
    const primeReact = useContext(PrimeReactContext);
    if (!primeReact || setup[licenseConfiguredAttestation] !== true) {
        throw new unstable_AdapterError({
            code: unstable_adapterErrorCodes.missingLicenseKey,
            adapterId: 'cratis-primereact',
            message:
                'PrimeReact 11 requires an application-owned outer PrimeReactProvider and a non-secret license-configuration attestation.',
            remedy: "Mount PrimeReactProvider outside CratisComponentsProvider with its license prop, then set rendererSetup['cratis-primereact.license-configured'] to true only when the application supplied the key.",
        });
    }
    return children;
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
    'common.button': declaration<'common.button'>(PrimeButtonSlot),
    'common.iconButton': declaration<'common.iconButton'>(PrimeIconButtonSlot),
    'common.textInput': declaration<'common.textInput'>(PrimeTextInputSlot),
    'common.textArea': declaration<'common.textArea'>(PrimeTextAreaSlot),
    'common.checkbox': declaration<'common.checkbox'>(PrimeCheckboxSlot),
    'common.radio': declaration<'common.radio'>(PrimeRadioSlot),
    'common.switch': declaration<'common.switch'>(PrimeSwitchSlot),
    'common.progress': declaration<'common.progress'>(PrimeProgressSlot),
    'common.surface': declaration<'common.surface'>(PrimeSurfaceSlot),
});

const atomicSlots = Object.freeze({
    'datatables.paginator': Object.freeze({
        mode: 'atomic',
        fidelity: 'native',
        render: PrimePaginatorSlot,
    }),
    'dialogs.dialog': Object.freeze({
        mode: 'atomic',
        fidelity: 'native',
        render: PrimeDialogSlot,
    }),
});

/** PrimeReact 11 implementation of the stable Cratis presentation profile. */
export const primeReactUiLibrary: CratisPresentationUiLibrary =
    definePresentationUiLibrary({
        id: 'cratis-primereact',
        displayName: 'Cratis PrimeReact renderer',
        abi: CRATIS_PRESENTATION_ABI_VERSION,
        level: 'primitive',
        profile: CRATIS_PRESENTATION_PROFILE,
        profileSlots: cratisPresentationSlotIds,
        capabilities,
        slots,
        atomicSlots,
        Provider: PrimeReactAdapterProvider,
    });
