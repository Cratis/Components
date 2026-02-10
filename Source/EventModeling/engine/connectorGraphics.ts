// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { Connector, ElementData, EdgeSide } from '../types';

export interface ConnectorGraphics {
    id: string;
    graphics: PIXI.Graphics;
    connector: Connector;
    getElements: () => Map<string, ElementData>;
    isHovered: boolean;
}

const CONNECTOR_COLOR = 0x64748b;
const CONNECTOR_HOVER_COLOR = 0x3b82f6;
const CONNECTOR_WIDTH = 2;
const CONNECTOR_HOVER_WIDTH = 3;

export function createConnectorGraphics(
    connector: Connector,
    getElements: () => Map<string, ElementData>,
    onClick: (id: string) => void
): ConnectorGraphics {
    const graphics = new PIXI.Graphics();
    graphics.eventMode = 'static';
    graphics.cursor = 'pointer';
    graphics.hitArea = new PIXI.Rectangle(0, 0, 0, 0); // Will be updated

    const connectorGraphics: ConnectorGraphics = {
        id: connector.id,
        graphics,
        connector,
        getElements,
        isHovered: false,
    };

    drawConnector(graphics, connector, getElements(), false);

    graphics.on('click', () => {
        onClick(connector.id);
    });

    graphics.on('pointerover', () => {
        connectorGraphics.isHovered = true;
        // Use fresh element data from getter
        drawConnector(graphics, connector, connectorGraphics.getElements(), true);
    });

    graphics.on('pointerout', () => {
        connectorGraphics.isHovered = false;
        // Use fresh element data from getter
        drawConnector(graphics, connector, connectorGraphics.getElements(), false);
    });

    return connectorGraphics;
}

function drawConnector(
    graphics: PIXI.Graphics,
    connector: Connector,
    elements: Map<string, ElementData>,
    isHovered: boolean
): void {
    const fromElement = elements.get(connector.from.elementId);
    const toElement = elements.get(connector.to.elementId);

    if (!fromElement || !toElement) {
        graphics.clear();
        return;
    }

    const fromPoint = getEdgePosition(fromElement, connector.from.side);
    const toPoint = getEdgePosition(toElement, connector.to.side);

    graphics.clear();

    // Create a curved path using cubic Bezier
    const controlPointOffset = Math.abs(toPoint.x - fromPoint.x) / 3;
    
    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

    // Adjust control points based on connection direction
    if (connector.from.side === 'right' && connector.to.side === 'left') {
        // Horizontal connection
        cp1x = fromPoint.x + controlPointOffset;
        cp1y = fromPoint.y;
        cp2x = toPoint.x - controlPointOffset;
        cp2y = toPoint.y;
    } else if (connector.from.side === 'bottom' && connector.to.side === 'top') {
        // Vertical connection
        cp1x = fromPoint.x;
        cp1y = fromPoint.y + controlPointOffset;
        cp2x = toPoint.x;
        cp2y = toPoint.y - controlPointOffset;
    } else {
        // Mixed or diagonal connections
        switch (connector.from.side) {
            case 'right':
                cp1x = fromPoint.x + controlPointOffset;
                cp1y = fromPoint.y;
                break;
            case 'left':
                cp1x = fromPoint.x - controlPointOffset;
                cp1y = fromPoint.y;
                break;
            case 'bottom':
                cp1x = fromPoint.x;
                cp1y = fromPoint.y + controlPointOffset;
                break;
            case 'top':
            default:
                cp1x = fromPoint.x;
                cp1y = fromPoint.y - controlPointOffset;
                break;
        }

        switch (connector.to.side) {
            case 'left':
                cp2x = toPoint.x - controlPointOffset;
                cp2y = toPoint.y;
                break;
            case 'right':
                cp2x = toPoint.x + controlPointOffset;
                cp2y = toPoint.y;
                break;
            case 'top':
                cp2x = toPoint.x;
                cp2y = toPoint.y - controlPointOffset;
                break;
            case 'bottom':
            default:
                cp2x = toPoint.x;
                cp2y = toPoint.y + controlPointOffset;
                break;
        }
    }

    // Draw the curved line
    graphics.moveTo(fromPoint.x, fromPoint.y);
    graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toPoint.x, toPoint.y);
    graphics.stroke({
        color: isHovered ? CONNECTOR_HOVER_COLOR : CONNECTOR_COLOR,
        width: isHovered ? CONNECTOR_HOVER_WIDTH : CONNECTOR_WIDTH,
    });

    // Draw arrowhead at the end - pass all curve points for accurate tangent calculation
    drawArrowhead(graphics, fromPoint.x, fromPoint.y, cp1x, cp1y, cp2x, cp2y, toPoint.x, toPoint.y, isHovered);

    // Update hit area for better click detection
    const minX = Math.min(fromPoint.x, toPoint.x) - 10;
    const minY = Math.min(fromPoint.y, toPoint.y) - 10;
    const maxX = Math.max(fromPoint.x, toPoint.x) + 10;
    const maxY = Math.max(fromPoint.y, toPoint.y) + 10;
    graphics.hitArea = new PIXI.Rectangle(minX, minY, maxX - minX, maxY - minY);
}

function drawArrowhead(
    graphics: PIXI.Graphics,
    startX: number,
    startY: number,
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    endX: number,
    endY: number,
    isHovered: boolean
): void {
    const arrowSize = 10;
    
    // Calculate the tangent at the end of the Bezier curve (t = 1)
    // For cubic Bezier: B'(t) = 3(1-t)²(P1-P0) + 6(1-t)t(P2-P1) + 3t²(P3-P2)
    // At t = 1: B'(1) = 3(P3 - P2)
    // This gives us the direction the curve is heading at the endpoint
    const dx = 3 * (endX - cp2x);
    const dy = 3 * (endY - cp2y);
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return;

    const unitX = dx / length;
    const unitY = dy / length;

    // Calculate perpendicular
    const perpX = -unitY;
    const perpY = unitX;

    // Calculate arrowhead points
    const backX = endX - unitX * arrowSize;
    const backY = endY - unitY * arrowSize;
    const left = { x: backX + perpX * (arrowSize / 2), y: backY + perpY * (arrowSize / 2) };
    const right = { x: backX - perpX * (arrowSize / 2), y: backY - perpY * (arrowSize / 2) };

    // Draw filled arrowhead
    graphics.poly([
        endX, endY,
        left.x, left.y,
        right.x, right.y,
        endX, endY
    ]);
    graphics.fill({ color: isHovered ? CONNECTOR_HOVER_COLOR : CONNECTOR_COLOR });
}

function getEdgePosition(element: ElementData, side: EdgeSide): { x: number; y: number } {
    const { position, size } = element;
    
    switch (side) {
        case 'top':
            return { x: position.x + size.width / 2, y: position.y };
        case 'right':
            return { x: position.x + size.width, y: position.y + size.height / 2 };
        case 'bottom':
            return { x: position.x + size.width / 2, y: position.y + size.height };
        case 'left':
            return { x: position.x, y: position.y + size.height / 2 };
    }
}

export function updateConnectorGraphics(
    connectorGraphics: ConnectorGraphics,
    elements: Map<string, ElementData>
): void {
    // Preserve hover state when updating
    drawConnector(connectorGraphics.graphics, connectorGraphics.connector, elements, connectorGraphics.isHovered);
}
