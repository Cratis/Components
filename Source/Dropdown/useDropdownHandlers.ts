// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback } from 'react';
import type { Key, MouseEvent } from 'react';
import type { DropdownProps } from './Dropdown';
import type { DropdownState } from './useDropdownState';

interface TriggerState {
    labelledby: string | undefined;
    invalid: boolean;
    tabIndex: number | undefined;
}

// React Aria puts the selected value first. Keep the field label first while
// preserving the selected-value reference and all other context-generated ids.
const mergeLabelledby = (element: HTMLElement, labelledby: string) => {
    const references = [
        ...labelledby.split(/\s+/u),
        ...(element.getAttribute('aria-labelledby') ?? '').split(/\s+/u),
    ].filter(Boolean);
    element.setAttribute('aria-labelledby', [...new Set(references)].join(' '));
};

const applyTriggerAttributes = (element: HTMLButtonElement, { labelledby, invalid, tabIndex }: TriggerState) => {
    if (labelledby) mergeLabelledby(element, labelledby);
    if (invalid) element.setAttribute('aria-invalid', 'true');
    else element.removeAttribute('aria-invalid');
    if (tabIndex !== undefined) element.tabIndex = tabIndex;
};

/** The change handlers and trigger ref callback that act on the derived dropdown state. */
export const useDropdownHandlers = <T,>(props: DropdownProps<T>, state: DropdownState) => {
    const { onChange, tabIndex } = props;
    const { resolvedOptions, remember, comboBox, attachExternalLabel, effectiveAriaLabelledby, effectiveInvalid } = state;

    const selectOption = (key: Key | null) => {
        const option = resolvedOptions.find((candidate) => candidate.key === String(key));
        remember(option?.key ?? null);
        onChange?.((option?.value ?? null) as T, { source: 'user' });
        // React Aria hands the closing of a filtered overlay to whoever owns the value, and stands
        // down when that value does not come back as one of the options. Nothing about a committed
        // option is the consumer's to close, so close it here and let the filter text follow the
        // selection the Dropdown ends up showing.
        comboBox.current?.close();
    };
    const clearSelection = (event: MouseEvent<HTMLButtonElement>) => {
        remember(null);
        onChange?.(null as T, { source: 'user', nativeEvent: event.nativeEvent });
    };
    const clearSelections = (event: MouseEvent<HTMLButtonElement>) =>
        onChange?.([] as T, { source: 'user', nativeEvent: event.nativeEvent });
    const selectOptions = (keys: readonly Key[]) => {
        const selectedKeys = new Set(keys.map(String));
        const values = resolvedOptions
            .filter((option) => selectedKeys.has(option.key))
            .map((option) => option.value);
        onChange?.(values as T, { source: 'user' });
    };
    // React Aria's Select trigger context does not forward aria-invalid from its Button child.
    // Keep the Cratis validation contract on the actual focusable control after context props merge.
    const applyTriggerState = useCallback((element: HTMLButtonElement | null) => {
        attachExternalLabel(element);
        if (element) applyTriggerAttributes(element, { labelledby: effectiveAriaLabelledby, invalid: effectiveInvalid, tabIndex });
    }, [effectiveAriaLabelledby, effectiveInvalid, attachExternalLabel, tabIndex]);

    return { selectOption, clearSelection, clearSelections, selectOptions, applyTriggerState };
};
