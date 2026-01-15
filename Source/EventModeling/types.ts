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

/**
 * Calculate the optimal edge pair for a connector based on element positions.
 * Returns the best matching edges for visual clarity.
 */
export function calculateOptimalEdges(
    fromElement: ElementData,
    toElement: ElementData
): { fromSide: EdgeSide; toSide: EdgeSide } {
    // Calculate center points
    const fromCenter = {
        x: fromElement.position.x + fromElement.size.width / 2,
        y: fromElement.position.y + fromElement.size.height / 2,
    };
    const toCenter = {
        x: toElement.position.x + toElement.size.width / 2,
        y: toElement.position.y + toElement.size.height / 2,
    };

    // Calculate differences
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;

    // Determine primary direction based on which delta is larger
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    if (isHorizontal) {
        // Horizontal connection is primary
        if (dx > 0) {
            // Target is to the right
            return { fromSide: 'right', toSide: 'left' };
        } else {
            // Target is to the left
            return { fromSide: 'left', toSide: 'right' };
        }
    } else {
        // Vertical connection is primary
        if (dy > 0) {
            // Target is below
            return { fromSide: 'bottom', toSide: 'top' };
        } else {
            // Target is above
            return { fromSide: 'top', toSide: 'bottom' };
        }
    }
}
