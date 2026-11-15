// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';

export function readAnchorTheme(anchor: HTMLElement): CSSProperties {
    const computed = anchor.ownerDocument.defaultView?.getComputedStyle(anchor);
    if (!computed) return {};
    const tokens = Object.fromEntries(Array.from(computed)
        .filter(property => property.startsWith('--'))
        .map(property => [property, computed.getPropertyValue(property)]));
    return { ...tokens, colorScheme: computed.colorScheme };
}
