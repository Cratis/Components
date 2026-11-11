// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JSX } from 'react';

/** Renders a React Aria trigger button that mirrors its expanded state as `data-open`. */
export const renderTriggerWithOpenState = (props: JSX.IntrinsicElements['button']) => (
    <button
        {...props}
        data-open={
            props['aria-expanded'] === true || props['aria-expanded'] === 'true'
                ? true
                : undefined
        }
    />
);
