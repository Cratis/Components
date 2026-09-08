// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useRef, useState, type ForwardedRef } from 'react';

const assignRef = <T,>(ref: ForwardedRef<T>, value: T | null) => {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
};

/** Keeps canonical state attributes aligned with an uncontrolled native checkable input. */
export const useNativeCheckedState = (
    checked: boolean | undefined,
    defaultChecked: boolean | undefined,
    forwardedRef: ForwardedRef<HTMLInputElement>,
    observeRadioGroup = false,
) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uncontrolledChecked, setUncontrolledChecked] = useState(
        Boolean(defaultChecked),
    );
    const controlled = checked !== undefined;

    const ref = useCallback(
        (input: HTMLInputElement | null) => {
            inputRef.current = input;
            assignRef(forwardedRef, input);
        },
        [forwardedRef],
    );

    useEffect(() => {
        const input = inputRef.current;
        if (!input || controlled) return;
        const synchronize = () => queueMicrotask(() => setUncontrolledChecked(input.checked));
        const form = input.form;
        form?.addEventListener('reset', synchronize);
        if (observeRadioGroup)
            input.ownerDocument.addEventListener('change', synchronize);
        return () => {
            form?.removeEventListener('reset', synchronize);
            if (observeRadioGroup)
                input.ownerDocument.removeEventListener('change', synchronize);
        };
    }, [controlled, observeRadioGroup]);

    return {
        ref,
        selected: checked ?? uncontrolledChecked,
        synchronize: (nextChecked: boolean) => {
            if (!controlled) setUncontrolledChecked(nextChecked);
        },
    };
};
