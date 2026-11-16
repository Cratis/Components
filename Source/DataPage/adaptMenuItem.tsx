// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ActionMenuItem } from '../Common/ActionMenubar';
import type { MenuItemProps } from './DataPage';
import type { DataPageSelection } from './DataPageSelection';

export function adaptMenuItem(props: MenuItemProps, selection: DataPageSelection): ActionMenuItem {
    const Icon = props.icon;
    const unselected = selection.selectionMode === 'multiple'
        ? selection.selectedItems.length === 0
        : !selection.selectedItem;
    const disabled = (typeof props.disabled === 'function' ? props.disabled(selection) : props.disabled ?? false)
        || (unselected && (props.disableOnUnselected ?? false));

    return {
        label: props.label,
        icon: Icon ? <Icon className='cratis:mr-2' /> : undefined,
        disabled,
        command: () => {
            if (!disabled) props.command?.(selection);
        },
    };
}
