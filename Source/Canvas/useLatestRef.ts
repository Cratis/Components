// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';

/**
 * A ref that follows the latest value, updated after each commit, so long-lived event handlers
 * read current callbacks without being re-bound.
 * @param value The value to follow.
 * @returns The ref.
 */
export const useLatestRef = <TValue>(value: TValue) => {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref;
};
