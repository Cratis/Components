// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useContext } from 'react';
// PrimeReact 10's ESM files use directory imports that native Node rejects. Explicit legacy
// CommonJS entries preserve one peer-hosted runtime across Node SSR and application bundlers.
import { PrimeReactContext, PrimeReactProvider } from 'primereact/api/api.cjs.js';
import { PrimeButtonSlot, PrimeIconButtonSlot } from './button.js';
import { PrimeCheckboxSlot, PrimeRadioSlot, PrimeSwitchSlot } from './choice.js';
import { Prime10PaginatorSlot } from './paginator.js';
import { PrimeProgressSlot } from './progress.js';
import { PrimeSurfaceSlot } from './surface.js';
import { PrimeTextAreaSlot, PrimeTextInputSlot } from './textFields.js';
import {
    CRATIS_PRESENTATION_ABI_VERSION,
    CRATIS_PRESENTATION_PROFILE,
    cratisPresentationSlotIds,
    definePresentationUiLibrary,
    type CratisPresentationCapabilities,
    type CratisPresentationSlotDeclaration,
    type CratisPresentationSlotId,
    type CratisPresentationUiLibrary,
    type CratisPresentationUiLibraryProviderProps,
} from '@cratis/components/renderer';

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'ssr.staticRender',
] satisfies CratisPresentationCapabilities);

const PrimeReact10AdapterProvider = ({
    children,
}: CratisPresentationUiLibraryProviderProps) => {
    const applicationConfiguration = useContext(PrimeReactContext);
    if (applicationConfiguration !== undefined) return children;
    return <PrimeReactProvider>{children}</PrimeReactProvider>;
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
        render: Prime10PaginatorSlot,
    }),
});

/** PrimeReact 10 implementation of the stable Cratis presentation profile. */
export const primeReact10UiLibrary: CratisPresentationUiLibrary =
    definePresentationUiLibrary({
        id: 'cratis-primereact10',
        displayName: 'Cratis PrimeReact 10 renderer',
        abi: CRATIS_PRESENTATION_ABI_VERSION,
        level: 'primitive',
        profile: CRATIS_PRESENTATION_PROFILE,
        profileSlots: cratisPresentationSlotIds,
        capabilities,
        slots,
        atomicSlots,
        Provider: PrimeReact10AdapterProvider,
    });
