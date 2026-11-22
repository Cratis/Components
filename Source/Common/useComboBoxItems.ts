// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { ComboBoxFilter, ComboBoxOption, ComboBoxProps } from './ComboBox';

export const ACTION_KEY = '\u0000cratis-combobox-action';

const matches = (option: ComboBoxOption, text: string, filter: ComboBoxFilter) => {
    if (filter === 'none' || text === '') return true;
    const haystack = option.label.toLocaleLowerCase();
    const needle = text.toLocaleLowerCase();
    return filter === 'startsWith' ? haystack.startsWith(needle) : haystack.includes(needle);
};

export const useComboBoxItems = (props: ComboBoxProps, inputValue: string, showAllOptions: boolean) => {
    const { options, filter = 'contains', loading = false, failure, action } = props;
    const showsMessage = loading || failure !== undefined;
    const visibleOptions = useMemo(
        () => showsMessage ? [] : showAllOptions ? options : options.filter(option => matches(option, inputValue, filter)),
        [options, inputValue, filter, showsMessage, showAllOptions],
    );
    return useMemo(
        () => action && !showsMessage
            ? [...visibleOptions, { key: ACTION_KEY, label: '', description: undefined, disabled: false }]
            : visibleOptions,
        [visibleOptions, action, showsMessage],
    );
};
