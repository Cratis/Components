// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { NoteHandle } from './NoteHandle';

export interface ResizeStart {
    handle: NoteHandle;
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    zoom: number;
}
