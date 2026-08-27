// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import { ButtonImplementation } from '../Common/ButtonImplementation';
import { CheckboxImplementation } from '../Common/CheckboxImplementation';
import { DatePickerInputImplementation } from '../Common/DatePickerInputImplementation';
import { IconButtonImplementation } from '../Common/IconButtonImplementation';
import { RadioImplementation } from '../Common/RadioImplementation';
import { SurfaceImplementation } from '../Common/SurfaceImplementation';
import { SwitchImplementation } from '../Common/SwitchImplementation';
import { TextAreaImplementation } from '../Common/TextAreaImplementation';
import { TextInputImplementation } from '../Common/TextInputImplementation';
import { TooltipImplementation } from '../Common/TooltipImplementation';
import { TablePaginatorImplementation } from '../DataTables/TablePaginatorImplementation';
import { ProgressBarImplementation } from '../Display/ProgressBarImplementation';
import { DialogImplementation } from '../Dialogs/DialogImplementation';
import { DropdownImplementation } from '../Dropdown/DropdownImplementation';
import type { unstable_BehaviorMode, unstable_SlotMap } from './slots';

const nativeDeclaration = <Props>(
    mode: unstable_BehaviorMode,
    render: ComponentType<Props>,
) => Object.freeze({ mode, fidelity: 'native' as const, render });

/**
 * Complete Core slot inventory for renderer ABI proof and conformance tests only.
 *
 * Every facade owns its local Core declaration, so neither the setup-only provider nor the public
 * renderer barrel may import this private all-family table.
 */
export const unstable_coreSlots = Object.freeze({
    'common.button': nativeDeclaration('presentation', ButtonImplementation),
    'common.iconButton': nativeDeclaration('presentation', IconButtonImplementation),
    'common.textInput': nativeDeclaration('presentation', TextInputImplementation),
    'common.textArea': nativeDeclaration('presentation', TextAreaImplementation),
    'common.checkbox': nativeDeclaration('presentation', CheckboxImplementation),
    'common.radio': nativeDeclaration('presentation', RadioImplementation),
    'common.switch': nativeDeclaration('presentation', SwitchImplementation),
    'common.progress': nativeDeclaration('presentation', ProgressBarImplementation),
    'common.surface': nativeDeclaration('presentation', SurfaceImplementation),
    'common.tooltip': nativeDeclaration('atomic', TooltipImplementation),
    'dropdown.select': nativeDeclaration('atomic', DropdownImplementation),
    'dialogs.dialog': nativeDeclaration('atomic', DialogImplementation),
    'display.datePicker': nativeDeclaration('atomic', DatePickerInputImplementation),
    'datatables.paginator': nativeDeclaration('atomic', TablePaginatorImplementation),
}) satisfies unstable_SlotMap;
