// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import type * as PIXI from 'pixi.js';
import type { ItemId } from '../../engine/types';
import type { CardSprite } from './constants';

/** The Pixi application and containers a PivotCanvas renders into. */
export interface PivotStage {
    appRef: RefObject<PIXI.Application | null>;
    rootRef: RefObject<PIXI.Container | null>;
    groupsContainerRef: RefObject<PIXI.Container | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    spritesRef: RefObject<Map<ItemId, CardSprite>>;
    animationFrameRef: RefObject<number>;
    mountedRef: RefObject<boolean>;
    /** Set when the stage has changed and needs another render. */
    needsRenderRef: RefObject<boolean>;
    /** Whether the Pixi application is initialized. */
    pixiReady: boolean;
}
