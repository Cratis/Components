// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import type { ComboBoxPartAttributes } from './ComboBox';

export const partAttributes = (part: ComboBoxPartAttributes | undefined) => ({
    ...part,
    style: part?.style as CSSProperties | undefined,
});
