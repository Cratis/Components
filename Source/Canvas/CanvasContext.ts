// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type * as PIXI from 'pixi.js';

/** Pixi objects supplied after the Canvas renderer initializes. */
export interface CanvasContext {
    /** Pixi application owned by the Canvas. */
    app: PIXI.Application;
    /** Pixi world container receiving rendered items. */
    world: PIXI.Container;
}
