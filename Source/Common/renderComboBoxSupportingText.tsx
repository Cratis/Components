// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import { partAttributes } from './comboBoxAttributes';
import type { ComboBoxProps } from './ComboBox';
import type { useComboBoxPresentation } from './useComboBoxPresentation';

export const renderComboBoxSupportingText = (props: ComboBoxProps, presentation: ReturnType<typeof useComboBoxPresentation>) => {
    const { pt, description, errorMessage } = props;
    const { descriptionId, errorId } = presentation;
    return (
        <>
            {descriptionId && (
                <span
                    {...partAttributes(pt?.description)}
                    id={descriptionId}
                    className={classNames('cratis-combobox__description', pt?.description?.className)}
                    data-cratis-part='description'
                >
                    {description}
                </span>
            )}
            {errorId && (
                <span
                    {...partAttributes(pt?.error)}
                    id={errorId}
                    className={classNames('cratis-combobox__error', pt?.error?.className)}
                    data-cratis-part='error'
                    data-invalid='true'
                >
                    {errorMessage}
                </span>
            )}
        </>
    );
};
