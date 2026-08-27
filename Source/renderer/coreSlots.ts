// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import { ButtonImplementation } from '../Common/ButtonImplementation';
import { CheckboxImplementation } from '../Common/CheckboxImplementation';
import { DatePickerInput } from '../Common/DatePickerInput';
import { IconButtonImplementation } from '../Common/IconButtonImplementation';
import { RadioImplementation } from '../Common/RadioImplementation';
import { SurfaceImplementation } from '../Common/SurfaceImplementation';
import { SwitchImplementation } from '../Common/SwitchImplementation';
import { TextAreaImplementation } from '../Common/TextAreaImplementation';
import { TextInputImplementation } from '../Common/TextInputImplementation';
import { Tooltip } from '../Common/Tooltip';
import { TablePaginator } from '../DataTables/TablePaginator';
import { ProgressBarImplementation } from '../Display/ProgressBarImplementation';
import { Dialog } from '../Dialogs/Dialog';
import { Dropdown } from '../Dropdown/Dropdown';
import type {
    unstable_BehaviorMode,
    unstable_SlotMap,
} from './slots';

const nativeDeclaration = <Props>(
    mode: unstable_BehaviorMode,
    render: ComponentType<Props>,
) => Object.freeze({ mode, fidelity: 'native' as const, render });

/**
 * Complete Core slot inventory for renderer ABI proof and conformance tests only.
 *
 * Facades own their local presentation declarations, so neither the setup-only provider nor the
 * public renderer barrel may import this table. The five atomic public components below require
 * implementation extraction and facade routing in E2 before this table can become runtime input.
 */
export const unstable_coreSlots = Object.freeze({
    'common.button': nativeDeclaration('presentation', ButtonImplementation),
    'common.iconButton': nativeDeclaration(
        'presentation',
        IconButtonImplementation,
    ),
    'common.textInput': nativeDeclaration('presentation', TextInputImplementation),
    'common.textArea': nativeDeclaration('presentation', TextAreaImplementation),
    'common.checkbox': nativeDeclaration('presentation', CheckboxImplementation),
    'common.radio': nativeDeclaration('presentation', RadioImplementation),
    'common.switch': nativeDeclaration('presentation', SwitchImplementation),
    'common.progress': nativeDeclaration('presentation', ProgressBarImplementation),
    'common.surface': nativeDeclaration('presentation', SurfaceImplementation),
    // E2: replace these public atomic components with non-facade implementations before wiring.
    'common.tooltip': nativeDeclaration('atomic', Tooltip),
    'dropdown.select': nativeDeclaration('atomic', Dropdown),
    'dialogs.dialog': nativeDeclaration('atomic', Dialog),
    'display.datePicker': nativeDeclaration('atomic', DatePickerInput),
    'datatables.paginator': nativeDeclaration('atomic', TablePaginator),
}) satisfies unstable_SlotMap;
