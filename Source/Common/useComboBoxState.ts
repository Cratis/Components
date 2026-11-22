// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState, type Key } from 'react';
import type { ComboBoxProps } from './ComboBox';
import { ACTION_KEY, useComboBoxItems } from './useComboBoxItems';

export const useComboBoxState = (props: ComboBoxProps) => {
    const { options, value, onChange, inputValue: controlledInputValue, onInputChange, openOnFocus = false, action } = props;
    const selectedLabel = options.find(option => option.key === value)?.label ?? '';
    const [uncontrolledInputValue, setUncontrolledInputValue] = useState(selectedLabel);
    const [editing, setEditing] = useState(false);
    // Opening by trigger, ArrowDown, or focus is not a search: show all options rather than only
    // the selected label. This mirrors React Aria's showAllItems before it sees the filtered items.
    const [showAllOptions, setShowAllOptions] = useState(false);
    // External resets and late options show the selected label; while editing, the text is the user's.
    useEffect(() => {
        if (!editing && controlledInputValue === undefined) setUncontrolledInputValue(selectedLabel);
    }, [selectedLabel, editing, controlledInputValue]);
    const inputValue = controlledInputValue ?? uncontrolledInputValue;
    const setInputValue = (text: string) => {
        // Changed text is a search again, whatever opened the list.
        if (text !== inputValue) setShowAllOptions(false);
        if (controlledInputValue === undefined) setUncontrolledInputValue(text);
        onInputChange?.(text);
    };
    const openChanged = (isOpen: boolean, trigger?: 'focus' | 'input' | 'manual') => {
        setEditing(isOpen);
        setShowAllOptions(isOpen && (trigger === 'manual' || (trigger === 'focus' && openOnFocus)));
    };
    const items = useComboBoxItems(props, inputValue, showAllOptions);
    const select = (key: Key | null) => {
        if (key === ACTION_KEY) {
            void action?.onAction(inputValue);
            return;
        }
        const next = key === null ? null : String(key);
        onChange(next);
        setInputValue(next === null ? '' : (options.find(option => option.key === next)?.label ?? ''));
    };
    return { inputValue, setInputValue, openChanged, setEditing, items, select };
};
