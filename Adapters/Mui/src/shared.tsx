// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ForwardedRef, ReactNode } from 'react';

export const classNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');


export type DataAttributes = {
    [name: `data-${string}`]: string | number | boolean | undefined;
};


export const assignRef = <T,>(ref: ForwardedRef<T>, value: T | null) => {
    if (typeof ref === 'function') ref(value);
    else if (ref) ref.current = value;
};


export const renderIcon = (icon: ReactNode) =>
    typeof icon === 'string' ? <i className={icon} aria-hidden='true' /> : icon;

