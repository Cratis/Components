// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import type { PivotCanvasProps } from '../PivotCanvasProps';
import type { CardColors } from './constants';
import type { PivotStage } from './PivotStage';
import type { PivotTransitionState } from './PivotTransitionState';

/** Everything the PivotCanvas render hooks read: props, stage, transition state and colors. */
export interface PivotRenderContext<TItem extends object> {
    props: PivotCanvasProps<TItem>;
    stage: PivotStage;
    transition: PivotTransitionState;
    cardColorsRef: RefObject<CardColors>;
    colorRevision: number;
    onCardClickRef: RefObject<PivotCanvasProps<TItem>['onCardClick']>;
    onPanStartRef: RefObject<PivotCanvasProps<TItem>['onPanStart']>;
}
