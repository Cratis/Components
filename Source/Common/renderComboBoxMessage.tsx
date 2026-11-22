// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import { partAttributes } from './comboBoxAttributes';
import type { ComboBoxProps } from './ComboBox';

export const renderComboBoxMessage = (props: ComboBoxProps) => {
    const { loading = false, loadingMessage, failure, emptyMessage, pt } = props;
    return loading ? (
        <div
            {...partAttributes(pt?.loading)}
            role='status'
            aria-busy='true'
            className={classNames('cratis-combobox__message', 'cratis-combobox__loading', pt?.loading?.className)}
            data-cratis-part='loading'
        >
            {loadingMessage}
        </div>
    ) : failure !== undefined ? (
        <div
            {...partAttributes(pt?.failure)}
            role='alert'
            className={classNames('cratis-combobox__message', 'cratis-combobox__failure', pt?.failure?.className)}
            data-cratis-part='failure'
        >
            {failure}
        </div>
    ) : (
        <div
            {...partAttributes(pt?.empty)}
            role='status'
            className={classNames('cratis-combobox__message', 'cratis-combobox__empty', pt?.empty?.className)}
            data-cratis-part='empty'
        >
            {emptyMessage}
        </div>
    );
};
