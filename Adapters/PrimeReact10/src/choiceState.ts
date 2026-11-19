// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ForwardedRef,
} from 'react';
import { assignRef } from './shared.js';

export const useNativeCheckedState = (
    checked: boolean | undefined,
    defaultChecked: boolean | undefined,
    forwardedRef: ForwardedRef<HTMLInputElement>,
    observeRadioGroup = false,
) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [selected, setSelected] = useState(Boolean(defaultChecked));
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
        const synchronize = () => queueMicrotask(() => setSelected(input.checked));
        input.form?.addEventListener('reset', synchronize);
        if (observeRadioGroup)
            input.ownerDocument.addEventListener('change', synchronize);
        return () => {
            input.form?.removeEventListener('reset', synchronize);
            if (observeRadioGroup)
                input.ownerDocument.removeEventListener('change', synchronize);
        };
    }, [controlled, observeRadioGroup]);
    return {
        ref,
        selected: checked ?? selected,
        synchronize: (next: boolean) => {
            if (!controlled) setSelected(next);
        },
    };
};

export const stateAttributes = (
    disabled: boolean | undefined,
    invalid: boolean,
    readOnly: boolean | undefined,
    selected: boolean,
) => ({
    'data-disabled': disabled || undefined,
    'data-invalid': invalid || undefined,
    'data-readonly': readOnly || undefined,
    'data-selected': selected || undefined,
});
