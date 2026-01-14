// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export type ElementType = 'command' | 'event' | 'readmodel' | 'process';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface ElementData {
    id: string;
    type: ElementType;
    position: Position;
    size: Size;
    label: string;
    description?: string;
}

export type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

export interface EdgePoint {
    elementId: string;
    side: EdgeSide;
}

export interface Connector {
    id: string;
    from: EdgePoint;
    to: EdgePoint;
}

export interface EventModelingState {
    elements: ElementData[];
    connectors: Connector[];
    selectedElementId?: string;
    selectedConnectorId?: string;
}

export interface CanvasTransform {
    x: number;
    y: number;
    scale: number;
}

export const ELEMENT_COLORS = {
    command: {
        background: 0x3b82f6,
        text: 0xffffff,
    },
    event: {
        background: 0xf59e0b,
        text: 0xffffff,
    },
    readmodel: {
        background: 0x10b981,
        text: 0xffffff,
    },
    process: {
        fill: 0x6b7280,
        stroke: 0x374151,
    },
} as const;

export const DEFAULT_ELEMENT_SIZE = {
    command: { width: 200, height: 100 },
    event: { width: 200, height: 100 },
    readmodel: { width: 200, height: 100 },
    process: { width: 80, height: 80 },
} as const;
