// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import type { NumberInputPartAttributes } from './NumberInputPartAttributes';

export const partAttributes = (part: NumberInputPartAttributes | undefined) => ({
    ...part,
    style: part?.style as CSSProperties | undefined,
});
