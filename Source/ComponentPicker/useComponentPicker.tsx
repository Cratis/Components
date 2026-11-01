// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ComponentPicker } from './ComponentPicker';
import type { ComponentResolver } from './ComponentResolver';
import type { PickedComponent } from './PickedComponent';

/** Options for {@link useComponentPicker}. */
export interface ComponentPickerOptions {
    /** Adds context from outside the library to each picked component. */
    resolve?: ComponentResolver;
}

/** What {@link useComponentPicker} returns. */
export interface ComponentPickerController {
    /** Whether picking is on. */
    isPicking: boolean;
    /** Starts picking. Resolves with the confirmed component, or `null` when picking was cancelled or stopped. */
    start: () => Promise<PickedComponent | null>;
    /** Stops picking. A pending {@link start} resolves with `null`. */
    cancel: () => void;
    /** The picker overlay. Render it once, anywhere under the Components provider. */
    picker: ReactElement;
}

/**
 * Starts and stops component picking imperatively.
 *
 * ```tsx
 * const { start, picker } = useComponentPicker();
 * // render {picker} once, then:
 * const picked = await start();
 * ```
 */
export const useComponentPicker = (options: ComponentPickerOptions = {}): ComponentPickerController => {
    const [isPicking, setIsPicking] = useState(false);
    const settle = useRef<((picked: PickedComponent | null) => void) | null>(null);

    const finish = useCallback((picked: PickedComponent | null) => {
        const pending = settle.current;
        settle.current = null;
        setIsPicking(false);
        pending?.(picked);
    }, []);

    const start = useCallback(() => {
        finish(null);
        return new Promise<PickedComponent | null>((resolve) => {
            settle.current = resolve;
            setIsPicking(true);
        });
    }, [finish]);

    const cancel = useCallback(() => finish(null), [finish]);

    useEffect(() => () => {
        settle.current?.(null);
        settle.current = null;
    }, []);

    const picker = useMemo(
        () => <ComponentPicker active={isPicking} onPick={finish} onCancel={cancel} resolve={options.resolve} />,
        [isPicking, finish, cancel, options.resolve],
    );

    return { isPicking, start, cancel, picker };
};
