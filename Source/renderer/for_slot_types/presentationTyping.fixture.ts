// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import type { CratisComponentsProviderProps } from '@cratis/components';
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
    type CratisRendererSetup,
    type unstable_RendererSetup,
} from '@cratis/components/renderer';

declare module '@cratis/components/renderer' {
    interface CratisRendererSetupExtensions {
        'sample.stable-setup': boolean;
    }

    interface unstable_RendererSetupExtensions {
        'sample.compatibility-setup': boolean;
    }
}

declare const Button: ComponentType<CratisPresentationSlots['common.button']>;
declare const IconButton: ComponentType<
    CratisPresentationSlots['common.iconButton']
>;
declare const TextInput: ComponentType<
    CratisPresentationSlots['common.textInput']
>;
declare const TextArea: ComponentType<
    CratisPresentationSlots['common.textArea']
>;
declare const Checkbox: ComponentType<
    CratisPresentationSlots['common.checkbox']
>;
declare const Radio: ComponentType<CratisPresentationSlots['common.radio']>;
declare const Switch: ComponentType<CratisPresentationSlots['common.switch']>;
declare const Progress: ComponentType<
    CratisPresentationSlots['common.progress']
>;
declare const Surface: ComponentType<CratisPresentationSlots['common.surface']>;
declare const Tooltip: ComponentType<{ readonly tooltip: string }>;

const declaration = <SlotId extends CratisPresentationSlotId>(
    render: CratisPresentationSlotDeclaration<SlotId>['render'],
): CratisPresentationSlotDeclaration<SlotId> => ({
    mode: 'presentation',
    fidelity: 'native',
    render,
});

const slots: CratisPresentationSlotMap = {
    'common.button': declaration<'common.button'>(Button),
    'common.iconButton': declaration<'common.iconButton'>(IconButton),
    'common.textInput': declaration<'common.textInput'>(TextInput),
    'common.textArea': declaration<'common.textArea'>(TextArea),
    'common.checkbox': declaration<'common.checkbox'>(Checkbox),
    'common.radio': declaration<'common.radio'>(Radio),
    'common.switch': declaration<'common.switch'>(Switch),
    'common.progress': declaration<'common.progress'>(Progress),
    'common.surface': declaration<'common.surface'>(Surface),
};

const library: CratisPresentationUiLibrary = definePresentationUiLibrary({
    id: 'sample',
    displayName: 'Sample',
    abi: CRATIS_PRESENTATION_ABI_VERSION,
    level: 'primitive',
    profile: CRATIS_PRESENTATION_PROFILE,
    profileSlots: cratisPresentationSlotIds,
    capabilities: [
        'slot.render',
        'parts.passthrough',
        'ssr.staticRender',
    ],
    slots,
});

const providerProps: Omit<CratisComponentsProviderProps, 'children'> = {
    library,
    overlayEnvironment: { getContainer: () => null },
    rendererSetup: {
        'sample.stable-setup': true,
        'sample.compatibility-setup': false,
    },
};

const setup: CratisRendererSetup = {
    'sample.stable-setup': true,
    'sample.compatibility-setup': true,
};
const compatibilitySetup: unstable_RendererSetup = setup;

// @ts-expect-error Atomic slots are outside the stable presentation profile.
const atomicSlot: CratisPresentationSlotId = 'common.tooltip';

// @ts-expect-error Every stable presentation declaration must include all nine slots.
const missingSlot: CratisPresentationSlotMap = {
    'common.button': declaration<'common.button'>(Button),
    'common.iconButton': declaration<'common.iconButton'>(IconButton),
    'common.textInput': declaration<'common.textInput'>(TextInput),
    'common.textArea': declaration<'common.textArea'>(TextArea),
    'common.checkbox': declaration<'common.checkbox'>(Checkbox),
    'common.radio': declaration<'common.radio'>(Radio),
    'common.switch': declaration<'common.switch'>(Switch),
    'common.progress': declaration<'common.progress'>(Progress),
};

const extraSlot = {
    ...slots,
    // @ts-expect-error Slots outside the immutable profile cannot enter its map.
    'common.tooltip': declaration<'common.button'>(Button),
} satisfies CratisPresentationSlotMap;

const atomicMode: CratisPresentationSlotDeclaration<'common.button'> = {
    // @ts-expect-error Stable slots always preserve Components behavior ownership.
    mode: 'atomic',
    fidelity: 'native',
    render: Button,
};
const unsupportedFidelity: CratisPresentationSlotDeclaration<'common.button'> = {
    mode: 'presentation',
    // @ts-expect-error Unsupported fidelity cannot claim the stable profile.
    fidelity: 'unsupported',
    render: Button,
};
const wrongProps: CratisPresentationSlotDeclaration<'common.button'> = {
    mode: 'presentation',
    fidelity: 'native',
    // @ts-expect-error Stable slots preserve the exact public component prop contract.
    render: Tooltip,
};
const wrongSetup: CratisRendererSetup = {
    // @ts-expect-error Renderer setup accepts booleans, never credentials.
    'sample.stable-setup': 'secret',
};

void atomicMode;
void atomicSlot;
void compatibilitySetup;
void extraSlot;
void missingSlot;
void providerProps;
void unsupportedFidelity;
void wrongProps;
void wrongSetup;
