// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { ListBox as AriaListBox, Popover as AriaPopover } from 'react-aria-components/ComboBox';
import { UNSAFE_PortalProvider } from 'react-aria';
import { classNames } from '../ClassNames/classNames';
import { asReactAriaListBoxProps } from './reactAriaProps';
import { partAttributes } from './comboBoxAttributes';
import { renderComboBoxMessage } from './renderComboBoxMessage';
import { renderComboBoxOption } from './renderComboBoxOption';
import type { ComboBoxOption, ComboBoxProps } from './ComboBox';
import type { useComboBoxPresentation } from './useComboBoxPresentation';
import type { useComboBoxState } from './useComboBoxState';

export const renderComboBoxPopover = (
    props: ComboBoxProps,
    state: ReturnType<typeof useComboBoxState>,
    presentation: ReturnType<typeof useComboBoxPresentation>,
) => {
    const { pt, optionLayout = 'inline' } = props;
    const { overlayEnvironment, popoverZIndex } = presentation;
    return (
        <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
            <AriaPopover
                {...partAttributes(pt?.popover)}
                className={classNames('cratis-combobox__popover', pt?.popover?.className)}
                style={{ zIndex: popoverZIndex, ...(pt?.popover?.style as CSSProperties | undefined) }}
                data-cratis-part='popover'
                data-open
            >
                <AriaListBox<ComboBoxOption>
                    {...asReactAriaListBoxProps<ComboBoxOption>(partAttributes(pt?.listbox))}
                    items={state.items}
                    className={classNames('cratis-combobox__listbox', pt?.listbox?.className)}
                    data-cratis-part='listbox'
                    data-option-layout={optionLayout}
                    renderEmptyState={() => renderComboBoxMessage(props)}
                >
                    {option => renderComboBoxOption(option, props)}
                </AriaListBox>
            </AriaPopover>
        </UNSAFE_PortalProvider>
    );
};
