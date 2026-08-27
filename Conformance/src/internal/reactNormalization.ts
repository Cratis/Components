// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties, Ref } from 'react';

/** Internal vendor-to-React prop normalization used by executable fixtures. */
export const normalizeReactProps = (
    props: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
        const normalizedKey = key === 'class' ? 'className'
            : key === 'for' ? 'htmlFor'
                : key === 'stroke-width' ? 'strokeWidth'
                    : key === 'fill-rule' ? 'fillRule'
                        : key;
        normalized[normalizedKey] = value;
    }
    return normalized;
};

/** Merges object and callback refs without hiding either assignment. */
export const mergeRefs = <T>(...refs: readonly (Ref<T> | undefined)[]): Ref<T> =>
    (value: T | null) => {
        for (const ref of refs) {
            if (typeof ref === 'function') ref(value);
            else if (ref) ref.current = value;
        }
    };

/** Runs pass-through behavior first and honors preventDefault before public behavior. */
export const composeHandlers = <T extends Event>(
    first: ((event: T) => void) | undefined,
    second: ((event: T) => void) | undefined,
) => (event: T) => {
    first?.(event);
    if (!event.defaultPrevented) second?.(event);
};

/** Registers a listener and returns idempotent StrictMode-safe cleanup. */
export const listen = <K extends keyof DocumentEventMap>(
    document: Document,
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
) => {
    let active = true;
    const eventListener = listener as EventListener;
    document.addEventListener(type, eventListener);
    return () => {
        if (!active) return;
        active = false;
        document.removeEventListener(type, eventListener);
    };
};

/** Constructs style evidence without dropping CSS custom properties. */
export const normalizeStyle = (
    style: CSSProperties & Readonly<Record<`--${string}`, string | number>>,
): CSSProperties => ({ ...style });
