// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
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

/**
 * Renderer slots backed by real public component contracts in Components V4.
 *
 * This interface is intentionally open so an adapter can declaration-merge private slots without
 * making vendor types part of the Core package. Element-bounded Common controls and progress are
 * presentation candidates; tooltip, select, dialog, date picker, and paginator remain
 * interaction-heavy. CommandForm fields are Arc-bound composites and never substitute for the
 * standalone primitive contracts.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export interface unstable_CratisSlots {
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

/**
 * Identifier of a declared renderer slot.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_SlotId = keyof unstable_CratisSlots;

/**
 * Ownership mode for a renderer slot. Presentation mode preserves Core behavior; atomic mode gives
 * the adapter ownership of the complete interaction.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_BehaviorMode = 'presentation' | 'atomic';

/**
 * Fidelity with which an adapter implements a slot.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_Fidelity = 'native' | 'emulated' | 'unsupported';

/**
 * One typed renderer implementation and its behavior/fidelity declaration.
 *
 * @typeParam K Slot implemented by the declaration.
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export interface unstable_SlotDeclaration<K extends unstable_SlotId> {
    /** Which layer owns the slot's interaction behavior. */
    readonly mode: unstable_BehaviorMode;
    /** How faithfully the adapter satisfies the Core slot contract. */
    readonly fidelity: unstable_Fidelity;
    /** React component implementing the slot's exact public props. */
    readonly render: ComponentType<unstable_CratisSlots[K]>;
}

/**
 * Partial renderer slot table. A library may implement only the slots it honestly supports.
 *
 * @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it.
 */
export type unstable_SlotMap = {
    readonly [K in unstable_SlotId]?: unstable_SlotDeclaration<K>;
};
