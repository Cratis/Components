// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { unstable_CapabilityId } from '../capabilities.js';
import { unstable_coreSlots } from '../coreSlots.js';
import {
    unstable_CRATIS_UI_ABI_VERSION,
    unstable_defineUiLibrary,
    type unstable_UiLibrary,
} from '../manifest.js';
import type { unstable_SlotId } from '../slots.js';

const profileSlots = Object.freeze([
    'common.button',
    'common.iconButton',
    'common.textInput',
    'common.textArea',
    'common.checkbox',
    'common.radio',
    'common.switch',
    'common.progress',
    'common.surface',
    'common.tooltip',
    'dropdown.select',
    'dialogs.dialog',
    'display.datePicker',
    'datatables.paginator',
] satisfies readonly unstable_SlotId[]);

const capabilities = Object.freeze([
    'slot.render',
    'parts.passthrough',
    'focus.trap',
    'focus.restore',
    'overlay.portal',
    'selection.multi',
    'datetime.i18n',
    'form.validationMessage',
    'theme.tokens',
    'ssr.staticRender',
    'rtl',
    'forcedColors',
    'motion.reduced',
] satisfies readonly unstable_CapabilityId[]);

/**
 * Opt-in manifest for the Components-owned implementations of every renderer ABI v1 slot.
 *
 * This proof adapter is intentionally isolated to `@cratis/components/renderer/builtin`. Importing
 * it opts into the complete component-family graph; the package root and lean `./renderer` subpath
 * never reach this manifest or the private Core slot table behind it.
 *
 * @unstable Adapter-author proof contract. It is not an application default or a discovery API.
 */
export const unstable_cratisBuiltIn: unstable_UiLibrary =
    unstable_defineUiLibrary({
        id: 'cratis-built-in',
        displayName: 'Cratis built-in renderer',
        abi: unstable_CRATIS_UI_ABI_VERSION,
        level: 'full',
        profile: 'core/v1',
        profileSlots,
        capabilities,
        slots: unstable_coreSlots,
    });
