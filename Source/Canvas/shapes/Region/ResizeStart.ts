// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HandleKey } from './HandleKey';

export interface ResizeStart {
    handle: HandleKey;
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    zoom: number;
}
