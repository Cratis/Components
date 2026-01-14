// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import { ElementData, ELEMENT_COLORS, EdgeSide } from '../types';

export interface ElementSprite {
    id: string;
    container: PIXI.Container;
    graphics: PIXI.Graphics;
    labelText: PIXI.Text;
    descriptionText?: PIXI.Text;
    edgePoints: Map<EdgeSide, PIXI.Graphics>;
    data: ElementData;
    isDragging: boolean;
    dragOffset?: { x: number; y: number };
}

const EDGE_POINT_RADIUS = 6;
const BORDER_RADIUS = 8;
const PADDING = 16;

export function createElementSprite(
    data: ElementData,
    onElementClick: (id: string) => void,
    onElementDragStart: (id: string, x: number, y: number) => void,
    onElementDragMove: (id: string, x: number, y: number) => void,
    onElementDragEnd: (id: string) => void,
    onEdgeClick: (elementId: string, side: EdgeSide) => void
): ElementSprite {
    const container = new PIXI.Container();
    container.position.set(data.position.x, data.position.y);
    container.eventMode = 'static';
    container.cursor = 'move';
    // Set explicit hit area for interaction
    container.hitArea = new PIXI.Rectangle(0, 0, data.size.width, data.size.height);

    const graphics = new PIXI.Graphics();
    const edgePoints = new Map<EdgeSide, PIXI.Graphics>();

    // Get colors based on element type
    const elementColors = ELEMENT_COLORS[data.type];
    const backgroundColor = 'background' in elementColors ? elementColors.background : elementColors.fill;
    
    // Draw with proper shapes (PIXI v8 requires fill with object format)
    if (data.type === 'process') {
        const centerX = data.size.width / 2;
        const centerY = data.size.height / 2;
        const radius = Math.min(data.size.width, data.size.height) / 2;
        graphics.circle(centerX, centerY, radius);
        graphics.fill({ color: backgroundColor });
        if ('stroke' in elementColors) {
            graphics.stroke({ color: elementColors.stroke, width: 2 });
        }
    } else {
        // Use roundRect for proper appearance
        graphics.roundRect(0, 0, data.size.width, data.size.height, BORDER_RADIUS);
        graphics.fill({ color: backgroundColor });
    }

    container.addChild(graphics);

    // Create label text
    const textColor = 'text' in elementColors ? elementColors.text : 0xffffff;
    const labelText = new PIXI.Text({
        text: data.label,
        style: {
            fontSize: 14,
            fill: textColor,
            fontWeight: '600',
            wordWrap: true,
            wordWrapWidth: data.size.width - PADDING * 2,
        } as PIXI.TextStyle,
    });
    labelText.position.set(PADDING, PADDING);
    container.addChild(labelText);

    // Create description text if exists
    let descriptionText: PIXI.Text | undefined;
    if (data.description && data.type !== 'process') {
        descriptionText = new PIXI.Text({
            text: data.description,
            style: new PIXI.TextStyle({
                fontSize: 12,
                fill: textColor,
                fontWeight: '400',
                wordWrap: true,
                wordWrapWidth: data.size.width - PADDING * 2,
            }),
        });
        descriptionText.alpha = 0.9;
        descriptionText.position.set(PADDING, PADDING + 24);
        container.addChild(descriptionText);
    }

    // Create edge points for connections
    if (data.type !== 'process') {
        const sides: EdgeSide[] = ['top', 'right', 'bottom', 'left'];
        sides.forEach(side => {
            const edgePoint = createEdgePoint(data, side, () => onEdgeClick(data.id, side));
            edgePoints.set(side, edgePoint);
            container.addChild(edgePoint);
        });
    }

    // Set up interaction
    container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
        if (!container.parent) return;
        const localPos = event.getLocalPosition(container.parent);
        onElementDragStart(data.id, localPos.x - data.position.x, localPos.y - data.position.y);
    });

    container.on('click', () => {
        onElementClick(data.id);
    });

    return {
        id: data.id,
        container,
        graphics,
        labelText,
        descriptionText,
        edgePoints,
        data,
        isDragging: false,
    };
}

function drawBoxElement(graphics: PIXI.Graphics, data: ElementData): void {
    const colors = ELEMENT_COLORS[data.type];
    if (!('background' in colors)) {
        return;
    }
    
    graphics.clear();
    
    // Draw the rounded rectangle with solid fill (PIXI v8 - use object format)
    graphics.roundRect(0, 0, data.size.width, data.size.height, BORDER_RADIUS);
    graphics.fill({ color: colors.background });
    
    // Force visibility
    graphics.visible = true;
    graphics.alpha = 1;
}

function drawProcessElement(graphics: PIXI.Graphics, data: ElementData): void {
    const colors = ELEMENT_COLORS.process;
    const centerX = data.size.width / 2;
    const centerY = data.size.height / 2;
    const radius = Math.min(data.size.width, data.size.height) / 2;

    graphics.clear();
    
    // Draw outer circle
    graphics.circle(centerX, centerY, radius);
    graphics.fill({ color: colors.fill });
    graphics.stroke({ color: colors.stroke, width: 2 });

    // Draw cogwheel teeth
    const teeth = 8;
    const toothLength = radius * 0.2;
    const innerRadius = radius * 0.6;
    
    for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const nextAngle = ((i + 0.4) / teeth) * Math.PI * 2;
        
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + toothLength);
        const y2 = centerY + Math.sin(angle) * (radius + toothLength);
        const x3 = centerX + Math.cos(nextAngle) * (radius + toothLength);
        const y3 = centerY + Math.sin(nextAngle) * (radius + toothLength);
        const x4 = centerX + Math.cos(nextAngle) * radius;
        const y4 = centerY + Math.sin(nextAngle) * radius;
        
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.lineTo(x3, y3);
        graphics.lineTo(x4, y4);
        graphics.fill({ color: colors.fill });
    }

    // Draw inner circle
    graphics.circle(centerX, centerY, innerRadius);
    graphics.fill({ color: 0xffffff });
    graphics.stroke({ color: colors.stroke, width: 2 });
}

function createEdgePoint(data: ElementData, side: EdgeSide, onClick: () => void): PIXI.Graphics {
    const edgePoint = new PIXI.Graphics();
    edgePoint.eventMode = 'static';
    edgePoint.cursor = 'crosshair';
    
    // Set explicit hit area for better interaction
    const hitSize = EDGE_POINT_RADIUS * 2;
    edgePoint.hitArea = new PIXI.Circle(0, 0, hitSize);
    
    // Position based on side
    let x = 0, y = 0;
    switch (side) {
        case 'top':
            x = data.size.width / 2;
            y = 0;
            break;
        case 'right':
            x = data.size.width;
            y = data.size.height / 2;
            break;
        case 'bottom':
            x = data.size.width / 2;
            y = data.size.height;
            break;
        case 'left':
            x = 0;
            y = data.size.height / 2;
            break;
    }

    edgePoint.position.set(x, y);
    
    // Draw edge point (initially hidden)
    const colors = ELEMENT_COLORS[data.type];
    edgePoint.circle(0, 0, EDGE_POINT_RADIUS);
    edgePoint.fill({ color: 0xffffff });
    edgePoint.stroke({ color: 'background' in colors ? colors.background : 0x6b7280, width: 2 });
    edgePoint.alpha = 0;

    edgePoint.on('click', (e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();
        onClick();
    });

    return edgePoint;
}

export function updateElementSprite(sprite: ElementSprite, data: ElementData): void {
    sprite.data = data;
    sprite.container.position.set(data.position.x, data.position.y);
    
    // Update graphics
    if (data.type === 'process') {
        drawProcessElement(sprite.graphics, data);
    } else {
        drawBoxElement(sprite.graphics, data);
    }

    // Update text
    sprite.labelText.text = data.label;
    if (sprite.descriptionText && data.description) {
        sprite.descriptionText.text = data.description;
    }

    // Update edge points positions
    sprite.edgePoints.forEach((edgePoint, side) => {
        let x = 0, y = 0;
        switch (side) {
            case 'top':
                x = data.size.width / 2;
                y = 0;
                break;
            case 'right':
                x = data.size.width;
                y = data.size.height / 2;
                break;
            case 'bottom':
                x = data.size.width / 2;
                y = data.size.height;
                break;
            case 'left':
                x = 0;
                y = data.size.height / 2;
                break;
        }
        edgePoint.position.set(x, y);
    });
}

export function showEdgePoints(sprite: ElementSprite): void {
    sprite.edgePoints.forEach(edgePoint => {
        edgePoint.alpha = 1;
    });
}

export function hideEdgePoints(sprite: ElementSprite): void {
    sprite.edgePoints.forEach(edgePoint => {
        edgePoint.alpha = 0;
    });
}
