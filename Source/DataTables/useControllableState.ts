// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useState } from 'react';

/**
 * State that the owner controls when it passes a value, and that the component keeps itself when
 * the value is undefined. Changes are always reported through the change handler.
 * @param value The controlled value, or undefined to let the component keep its own state.
 * @param defaultValue The initial value while uncontrolled.
 * @param onChange Called with every new value.
 * @returns The current value and a setter.
 */
export const useControllableState = <TValue>(
    value: TValue | undefined,
    defaultValue: TValue,
    onChange: ((next: TValue) => void) | undefined,
): [TValue, (next: TValue) => void] => {
    const [internal, setInternal] = useState(defaultValue);
    const controlled = value !== undefined;
    const set = useCallback((next: TValue) => {
        if (!controlled) setInternal(next);
        onChange?.(next);
    }, [controlled, onChange]);
    return [controlled ? value : internal, set];
};
