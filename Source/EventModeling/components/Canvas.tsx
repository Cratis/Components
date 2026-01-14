// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { EventModelingState, ElementType, ElementData, Connector, EdgeSide } from '../types';
import { createElementSprite, updateElementSprite, showEdgePoints, hideEdgePoints, ElementSprite } from '../engine/elementSprites';
import { createConnectorGraphics, updateConnectorGraphics, ConnectorGraphics } from '../engine/connectorGraphics';

export interface CanvasProps {
    state: EventModelingState;
    selectedTool: ElementType | 'select';
    zoom: number;
    pan: { x: number; y: number };
    onZoomChange: (zoom: number) => void;
    onPanChange: (pan: { x: number; y: number }) => void;
    onAddElement: (type: ElementType, x: number, y: number) => void;
    onUpdateElement: (id: string, updates: Partial<ElementData>) => void;
    onAddConnector: (connector: Connector) => void;
    onSelectElement: (id: string | undefined) => void;
    onSelectConnector: (id: string | undefined) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
    state,
    selectedTool,
    zoom,
    pan,
    onZoomChange,
    onPanChange,
    onAddElement,
    onUpdateElement,
    onAddConnector,
    onSelectElement,
    onSelectConnector,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const worldRef = useRef<PIXI.Container | null>(null);
    const elementsLayerRef = useRef<PIXI.Container | null>(null);
    const connectorsLayerRef = useRef<PIXI.Container | null>(null);
    
    const spritesRef = useRef<Map<string, ElementSprite>>(new Map());
    const connectorsRef = useRef<Map<string, ConnectorGraphics>>(new Map());
    const [pixiReady, setPixiReady] = useState(false);
    
    // Interaction state
    const draggingElementRef = useRef<{ id: string; startX: number; startY: number; elementStartX: number; elementStartY: number } | null>(null);
    const connectingFromRef = useRef<{ elementId: string; side: EdgeSide; startX: number; startY: number } | null>(null);
    const tempConnectorLineRef = useRef<PIXI.Graphics | null>(null);
    
    // Refs to hold current values for event handlers (avoiding stale closures)
    const zoomRef = useRef(zoom);
    const panRef = useRef(pan);
    const selectedToolRef = useRef(selectedTool);
    const stateRef = useRef(state);
    const onZoomChangeRef = useRef(onZoomChange);
    const onPanChangeRef = useRef(onPanChange);
    const onAddElementRef = useRef(onAddElement);
    const onUpdateElementRef = useRef(onUpdateElement);
    const onAddConnectorRef = useRef(onAddConnector);
    const onSelectElementRef = useRef(onSelectElement);
    
    // Keep refs in sync with props
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { panRef.current = pan; }, [pan]);
    useEffect(() => { selectedToolRef.current = selectedTool; }, [selectedTool]);
    useEffect(() => { stateRef.current = state; }, [state]);
    useEffect(() => { onZoomChangeRef.current = onZoomChange; }, [onZoomChange]);
    useEffect(() => { onPanChangeRef.current = onPanChange; }, [onPanChange]);
    useEffect(() => { onAddElementRef.current = onAddElement; }, [onAddElement]);
    useEffect(() => { onUpdateElementRef.current = onUpdateElement; }, [onUpdateElement]);
    useEffect(() => { onAddConnectorRef.current = onAddConnector; }, [onAddConnector]);
    useEffect(() => { onSelectElementRef.current = onSelectElement; }, [onSelectElement]);

    // Convert screen coordinates to world coordinates
    const screenToWorld = useCallback((screenX: number, screenY: number) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const x = (screenX - rect.left - panRef.current.x) / zoomRef.current;
        const y = (screenY - rect.top - panRef.current.y) / zoomRef.current;
        return { x, y };
    }, []);

    // Helper to get edge position in world coordinates
    const getEdgePosition = useCallback((element: ElementData, side: EdgeSide) => {
        const { position, size } = element;
        switch (side) {
            case 'top': return { x: position.x + size.width / 2, y: position.y };
            case 'right': return { x: position.x + size.width, y: position.y + size.height / 2 };
            case 'bottom': return { x: position.x + size.width / 2, y: position.y + size.height };
            case 'left': return { x: position.x, y: position.y + size.height / 2 };
        }
    }, []);

    // Handle wheel events - trackpad natural scrolling for pan, pinch for zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;
        
        // Pinch-to-zoom (ctrlKey is true for pinch gestures on trackpad)
        if (e.ctrlKey) {
            // Zoom towards mouse position
            const delta = e.deltaY > 0 ? 0.95 : 1.05;
            const newZoom = Math.max(0.1, Math.min(5, currentZoom * delta));
            
            // Keep the point under cursor stationary
            const worldX = (mouseX - currentPan.x) / currentZoom;
            const worldY = (mouseY - currentPan.y) / currentZoom;
            const newPanX = mouseX - worldX * newZoom;
            const newPanY = mouseY - worldY * newZoom;
            
            onZoomChangeRef.current(newZoom);
            onPanChangeRef.current({ x: newPanX, y: newPanY });
        } else {
            // Two-finger scroll = pan (natural scrolling direction)
            const newPan = {
                x: currentPan.x - e.deltaX,
                y: currentPan.y - e.deltaY,
            };
            onPanChangeRef.current(newPan);
        }
    }, []);

    // Handle pointer down on canvas background - add element if tool selected
    const handleCanvasPointerDown = useCallback((e: PointerEvent) => {
        if (!containerRef.current) return;
        
        const tool = selectedToolRef.current;
        
        // If using a creation tool, add element at click position
        if (tool !== 'select') {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            onAddElementRef.current(tool, worldPos.x, worldPos.y);
        }
    }, [screenToWorld]);

    // Handle pointer move for dragging elements or drawing connectors
    const handlePointerMove = useCallback((e: PointerEvent) => {
        // Handle element dragging
        if (draggingElementRef.current) {
            const { id, startX, startY, elementStartX, elementStartY } = draggingElementRef.current;
            const dx = (e.clientX - startX) / zoomRef.current;
            const dy = (e.clientY - startY) / zoomRef.current;
            onUpdateElementRef.current(id, {
                position: { x: elementStartX + dx, y: elementStartY + dy }
            });
        }
        
        // Handle connector drawing preview line
        if (connectingFromRef.current && tempConnectorLineRef.current) {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            const line = tempConnectorLineRef.current;
            line.clear();
            line.moveTo(connectingFromRef.current.startX, connectingFromRef.current.startY);
            line.lineTo(worldPos.x, worldPos.y);
            line.stroke({ color: 0x6b7280, width: 2 });
        }
    }, [screenToWorld]);

    // Handle pointer up - finish dragging or cancel connecting
    const handlePointerUp = useCallback(() => {
        draggingElementRef.current = null;
        
        // Clean up temp connector line if connection wasn't completed
        if (tempConnectorLineRef.current) {
            tempConnectorLineRef.current.destroy();
            tempConnectorLineRef.current = null;
        }
        connectingFromRef.current = null;
    }, []);

    // Element pointer down - start dragging
    const handleElementPointerDown = useCallback((id: string, e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();
        
        const element = stateRef.current.elements.find(el => el.id === id);
        if (!element) return;
        
        // Start dragging
        draggingElementRef.current = {
            id,
            startX: e.globalX,
            startY: e.globalY,
            elementStartX: element.position.x,
            elementStartY: element.position.y,
        };
        
        // Select element
        onSelectElementRef.current(id);
    }, []);

    // Edge point pointer down - start connecting
    const handleEdgePointerDown = useCallback((elementId: string, side: EdgeSide, e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();
        
        const element = stateRef.current.elements.find(el => el.id === elementId);
        if (!element) return;
        
        // Calculate edge position in world coordinates
        const edgePos = getEdgePosition(element, side);
        
        // Start connecting - create temp line
        connectingFromRef.current = {
            elementId,
            side,
            startX: edgePos.x,
            startY: edgePos.y,
        };
        
        // Create temporary connector line
        if (worldRef.current) {
            const line = new PIXI.Graphics();
            worldRef.current.addChild(line);
            tempConnectorLineRef.current = line;
        }
    }, [getEdgePosition]);

    // Edge point pointer up - complete connection
    const handleEdgePointerUp = useCallback((elementId: string, side: EdgeSide, e: PIXI.FederatedPointerEvent) => {
        e.stopPropagation();
        
        if (connectingFromRef.current && connectingFromRef.current.elementId !== elementId) {
            // Complete the connection
            const connector: Connector = {
                id: `conn-${Date.now()}`,
                from: { elementId: connectingFromRef.current.elementId, side: connectingFromRef.current.side },
                to: { elementId, side },
            };
            onAddConnectorRef.current(connector);
        }
        
        // Clean up
        if (tempConnectorLineRef.current) {
            tempConnectorLineRef.current.destroy();
            tempConnectorLineRef.current = null;
        }
        connectingFromRef.current = null;
    }, []);

    const handleConnectorClick = useCallback((id: string) => {
        onSelectConnector(id);
        onSelectElement(undefined);
    }, [onSelectConnector, onSelectElement]);

    // Initialize PIXI
    useEffect(() => {
        if (!containerRef.current || appRef.current) return;

        let isMounted = true;

        const initPixi = async () => {
            const container = containerRef.current;
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            const width = rect.width > 0 ? rect.width : container.clientWidth || 800;
            const height = rect.height > 0 ? rect.height : container.clientHeight || 600;
            
            const app = new PIXI.Application();
            
            try {
                await app.init({
                    background: 0xf8f9fa,
                    antialias: true,
                    autoDensity: true,
                    resolution: window.devicePixelRatio || 1,
                    width,
                    height,
                    autoStart: true,
                });
                
                // Ensure ticker is running and rendering (required for PIXI v8)
                app.ticker.add(() => {
                    app.renderer.render(app.stage);
                });
            } catch (e) {
                console.error('PIXI init failed:', e);
                return;
            }

            if (!isMounted || !containerRef.current) {
                app.destroy(true, { children: true });
                return;
            }

            appRef.current = app;

            const world = new PIXI.Container();
            worldRef.current = world;
            app.stage.addChild(world);

            // Connectors layer (below elements)
            const connectorsLayer = new PIXI.Container();
            connectorsLayerRef.current = connectorsLayer;
            world.addChild(connectorsLayer);

            // Elements layer (above connectors)
            const elementsLayer = new PIXI.Container();
            elementsLayerRef.current = elementsLayer;
            world.addChild(elementsLayer);

            const canvasEl = app.canvas as HTMLCanvasElement;
            
            if (canvasEl && containerRef.current) {
                canvasEl.classList.add('event-modeling-canvas');
                canvasEl.style.touchAction = 'none'; // Prevent browser handling of touch
                containerRef.current.appendChild(canvasEl);
                canvasRef.current = canvasEl;

                // Set up event listeners
                canvasEl.addEventListener('wheel', handleWheel, { passive: false });
                canvasEl.addEventListener('pointerdown', handleCanvasPointerDown);
                canvasEl.addEventListener('pointermove', handlePointerMove);
                canvasEl.addEventListener('pointerup', handlePointerUp);
                canvasEl.addEventListener('pointerleave', handlePointerUp);
            }

            setPixiReady(true);
        };

        initPixi();

        return () => {
            isMounted = false;
            if (canvasRef.current) {
                canvasRef.current.removeEventListener('wheel', handleWheel);
                canvasRef.current.removeEventListener('pointerdown', handleCanvasPointerDown);
                canvasRef.current.removeEventListener('pointermove', handlePointerMove);
                canvasRef.current.removeEventListener('pointerup', handlePointerUp);
                canvasRef.current.removeEventListener('pointerleave', handlePointerUp);
            }
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
            }
        };
    }, [handleWheel, handleCanvasPointerDown, handlePointerMove, handlePointerUp]);

    // Update world transform when zoom/pan changes
    useEffect(() => {
        if (!pixiReady || !worldRef.current) return;
        worldRef.current.position.set(pan.x, pan.y);
        worldRef.current.scale.set(zoom);
    }, [pixiReady, zoom, pan]);

    // Sync elements to PIXI
    useEffect(() => {
        console.log('Sync useEffect running', { pixiReady, hasElementsLayer: !!elementsLayerRef.current, elementCount: state.elements.length });
        if (!pixiReady || !elementsLayerRef.current) {
            console.log('Sync useEffect early return', { pixiReady, hasElementsLayer: !!elementsLayerRef.current });
            return;
        }
        
        const elementsMap = new Map(state.elements.map(el => [el.id, el]));

        // Remove deleted elements
        spritesRef.current.forEach((sprite, id) => {
            if (!elementsMap.has(id)) {
                elementsLayerRef.current!.removeChild(sprite.container);
                sprite.container.destroy({ children: true });
                spritesRef.current.delete(id);
            }
        });

        // Add or update elements
        state.elements.forEach(elementData => {
            const existing = spritesRef.current.get(elementData.id);
            if (existing) {
                updateElementSprite(existing, elementData);
            } else {
                console.log('Creating sprite for', elementData.id, 'at', elementData.position.x, elementData.position.y);
                const sprite = createElementSprite(
                    elementData,
                    // These handlers are no-ops - we handle events globally via the container
                    Function.prototype as () => void,
                    Function.prototype as () => void,
                    Function.prototype as () => void,
                    Function.prototype as () => void,
                    Function.prototype as () => void
                );
                
                spritesRef.current.set(elementData.id, sprite);
                elementsLayerRef.current!.addChild(sprite.container);
                console.log('Sprite added to layer', { 
                    spritePos: { x: sprite.container.position.x, y: sprite.container.position.y },
                    layerChildren: elementsLayerRef.current!.children.length,
                    visible: sprite.container.visible,
                    alpha: sprite.container.alpha
                });
                
                // Set up proper pointer events on the element
                sprite.container.eventMode = 'static';
                sprite.container.cursor = 'grab';
                
                sprite.container.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                    handleElementPointerDown(elementData.id, e);
                });
                
                // Set up edge point events for drag-to-connect
                sprite.edgePoints.forEach((edgePoint, side) => {
                    edgePoint.eventMode = 'static';
                    edgePoint.cursor = 'crosshair';
                    edgePoint.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                        handleEdgePointerDown(elementData.id, side, e);
                    });
                    edgePoint.on('pointerup', (e: PIXI.FederatedPointerEvent) => {
                        handleEdgePointerUp(elementData.id, side, e);
                    });
                    // Also listen for global pointer up on edge points to complete connection
                    edgePoint.on('pointerover', () => {
                        // Show edge is a valid drop target while connecting
                        if (connectingFromRef.current && connectingFromRef.current.elementId !== elementData.id) {
                            edgePoint.alpha = 1;
                            edgePoint.scale.set(1.5);
                        }
                    });
                    edgePoint.on('pointerout', () => {
                        edgePoint.scale.set(1);
                    });
                });

                // Show edge points on hover
                sprite.container.on('pointerover', () => showEdgePoints(sprite));
                sprite.container.on('pointerout', () => {
                    // Only hide if not actively connecting from this element
                    if (!connectingFromRef.current || connectingFromRef.current.elementId !== elementData.id) {
                        hideEdgePoints(sprite);
                    }
                });
            }
        });
    }, [pixiReady, state.elements, handleElementPointerDown, handleEdgePointerDown, handleEdgePointerUp]);

    // Sync connectors to PIXI
    useEffect(() => {
        if (!pixiReady || !connectorsLayerRef.current) return;

        const connectorsMap = new Map(state.connectors.map(conn => [conn.id, conn]));
        const elementsMap = new Map(state.elements.map(el => [el.id, el]));

        // Remove deleted connectors
        connectorsRef.current.forEach((connGraphics, id) => {
            if (!connectorsMap.has(id)) {
                connectorsLayerRef.current!.removeChild(connGraphics.graphics);
                connGraphics.graphics.destroy();
                connectorsRef.current.delete(id);
            }
        });

        // Add or update connectors
        state.connectors.forEach(connector => {
            const existing = connectorsRef.current.get(connector.id);
            if (existing) {
                updateConnectorGraphics(existing, elementsMap);
            } else {
                const connGraphics = createConnectorGraphics(
                    connector,
                    elementsMap,
                    handleConnectorClick
                );
                connectorsRef.current.set(connector.id, connGraphics);
                connectorsLayerRef.current!.addChild(connGraphics.graphics);
            }
        });
    }, [pixiReady, state.connectors, state.elements, handleConnectorClick]);

    return <div ref={containerRef} className="event-modeling-canvas-container" />;
};
