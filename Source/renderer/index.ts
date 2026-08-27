// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonProps } from '../Common/Button';
import type { CheckboxProps } from '../Common/Checkbox';
import type { DatePickerInputProps } from '../Common/DatePickerInput';
import type { IconButtonProps } from '../Common/IconButton';
import type { RadioProps } from '../Common/Radio';
import type { SurfaceProps } from '../Common/Surface';
import type { SwitchProps } from '../Common/Switch';
import type { TextAreaProps } from '../Common/TextArea';
import type { TextInputProps } from '../Common/TextInput';
import type { TooltipProps } from '../Common/Tooltip';
import type { TablePaginatorProps } from '../DataTables/TablePaginator';
import type { ProgressBarProps } from '../Display/ProgressBar';
import type { DialogProps } from '../Dialogs/Dialog';
import type { DropdownProps } from '../Dropdown/Dropdown';

/** Core-owned slot contracts loaded only by the renderer subpath. */
declare module './slots.js' {
    interface unstable_CratisSlots {
        /** Cratis button presentation contract. */
        'common.button': ButtonProps;
        /** Cratis icon-button presentation contract. */
        'common.iconButton': IconButtonProps;
        /** Native text-input presentation contract. */
        'common.textInput': TextInputProps;
        /** Native text-area presentation contract. */
        'common.textArea': TextAreaProps;
        /** Native checkbox presentation contract. */
        'common.checkbox': CheckboxProps;
        /** Native radio-option presentation contract. */
        'common.radio': RadioProps;
        /** Native switch presentation contract. */
        'common.switch': SwitchProps;
        /** Progress-bar presentation contract. */
        'common.progress': ProgressBarProps;
        /** Semantic surface presentation contract. */
        'common.surface': SurfaceProps;
        /** Interaction-heavy tooltip contract. */
        'common.tooltip': TooltipProps;
        /** Interaction-heavy select/dropdown contract. */
        'dropdown.select': DropdownProps<unknown>;
        /** Interaction-heavy modal dialog contract. */
        'dialogs.dialog': DialogProps;
        /** Interaction-heavy date-picker contract. */
        'display.datePicker': DatePickerInputProps;
        /** Interaction-heavy, composite-adjacent table paginator contract. */
        'datatables.paginator': TablePaginatorProps;
    }
}

/**
 * Experimental renderer contracts for adapter authors. Every public symbol is intentionally
 * `unstable_`-prefixed and isolated to `@cratis/components/renderer`. Component routing, built-in
 * manifests, and lazy/preload entries remain deferred.
 */
export type { unstable_CapabilityId } from './capabilities';
export {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type unstable_AdapterDiagnostic,
    type unstable_AdapterErrorCode,
} from './errors';
export {
    unstable_CRATIS_UI_ABI_VERSION,
    unstable_composeUiLibraries,
    unstable_defineUiLibrary,
    type unstable_RendererExtensions,
    type unstable_RendererProps,
    type unstable_UiLibrary,
} from './manifest';
export {
    unstable_defaultOverlayEnvironment,
    type unstable_CratisOverlayEnvironment,
} from './overlayEnvironment';
export {
    unstable_useCapability,
    unstable_useOverlayEnvironment,
    unstable_useRendererId,
    unstable_useSlot,
} from './RendererContext';
export {
    unstable_RendererScope,
    type unstable_RendererScopeProps,
} from './RendererScope';
export type {
    unstable_BehaviorMode,
    unstable_CratisSlots,
    unstable_Fidelity,
    unstable_SlotDeclaration,
    unstable_SlotId,
    unstable_SlotMap,
} from './slots';
