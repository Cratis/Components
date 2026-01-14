// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState, useCallback } from 'react';
import { EventModelingState, ElementData, Connector, ElementType, DEFAULT_ELEMENT_SIZE } from './types';
import { Toolbox } from './components/Toolbox';
import { Canvas } from './components/Canvas';
import { CanvasControls } from './components/CanvasControls';
import './EventModeling.css';

export interface EventModelingProps {
    initialState?: EventModelingState;
    onStateChange?: (state: EventModelingState) => void;
    width?: string;
    height?: string;
}

export const EventModeling: React.FC<EventModelingProps> = ({
    initialState,
    onStateChange,
    width = '100%',
    height = '100vh',
}) => {
    const [state, setState] = useState<EventModelingState>(
        initialState || {
            elements: [],
            connectors: [],
        }
    );

    const [selectedTool, setSelectedTool] = useState<ElementType | 'select'>('select');
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const updateState = useCallback((newState: EventModelingState) => {
        setState(newState);
        onStateChange?.(newState);
    }, [onStateChange]);

    const handleZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const handlePanChange = useCallback((newPan: { x: number; y: number }) => {
        setPan(newPan);
    }, []);

    const handleAddElement = useCallback((type: ElementType, x: number, y: number) => {
        console.log('Adding element:', type, 'at', x, y); // Debug log
        const size = DEFAULT_ELEMENT_SIZE[type];
        const newElement: ElementData = {
            id: `${type}-${Date.now()}`,
            type,
            position: { x, y },
            size,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        };

        updateState({
            ...state,
            elements: [...state.elements, newElement],
        });

        // Auto-switch back to select tool after adding
        setSelectedTool('select');
    }, [state, updateState]);

    const handleUpdateElement = useCallback((id: string, updates: Partial<ElementData>) => {
        updateState({
            ...state,
            elements: state.elements.map(el =>
                el.id === id ? { ...el, ...updates } : el
            ),
        });
    }, [state, updateState]);

    const handleDeleteElement = useCallback((id: string) => {
        updateState({
            ...state,
            elements: state.elements.filter(el => el.id !== id),
            connectors: state.connectors.filter(
                conn => conn.from.elementId !== id && conn.to.elementId !== id
            ),
            selectedElementId: state.selectedElementId === id ? undefined : state.selectedElementId,
        });
    }, [state, updateState]);

    const handleAddConnector = useCallback((connector: Connector) => {
        // Prevent connecting element to itself
        if (connector.from.elementId === connector.to.elementId) {
            return;
        }

        // Prevent duplicate connectors
        const isDuplicate = state.connectors.some(
            c => c.from.elementId === connector.from.elementId &&
                 c.from.side === connector.from.side &&
                 c.to.elementId === connector.to.elementId &&
                 c.to.side === connector.to.side
        );

        if (isDuplicate) {
            return;
        }

        updateState({
            ...state,
            connectors: [...state.connectors, connector],
        });
    }, [state, updateState]);

    const handleDeleteConnector = useCallback((id: string) => {
        updateState({
            ...state,
            connectors: state.connectors.filter(conn => conn.id !== id),
            selectedConnectorId: state.selectedConnectorId === id ? undefined : state.selectedConnectorId,
        });
    }, [state, updateState]);

    const handleSelectElement = useCallback((id: string | undefined) => {
        updateState({
            ...state,
            selectedElementId: id,
            selectedConnectorId: undefined,
        });
    }, [state, updateState]);

    const handleSelectConnector = useCallback((id: string | undefined) => {
        updateState({
            ...state,
            selectedConnectorId: id,
            selectedElementId: undefined,
        });
    }, [state, updateState]);

    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(5, prev * 1.2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(0.1, prev / 1.2));
    }, []);

    const handleZoomReset = useCallback(() => {
        setZoom(1);
    }, []);

    const handleFitToView = useCallback(() => {
        if (state.elements.length === 0) {
            setZoom(1);
            return;
        }

        // Calculate bounding box of all elements
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.elements.forEach(el => {
            minX = Math.min(minX, el.position.x);
            minY = Math.min(minY, el.position.y);
            maxX = Math.max(maxX, el.position.x + el.size.width);
            maxY = Math.max(maxY, el.position.y + el.size.height);
        });

        const padding = 50;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;

        // Get canvas size (approximate)
        const canvasWidth = window.innerWidth * 0.8;
        const canvasHeight = window.innerHeight * 0.8;

        const scaleX = canvasWidth / contentWidth;
        const scaleY = canvasHeight / contentHeight;
        const newZoom = Math.min(scaleX, scaleY, 1);

        setZoom(newZoom);
    }, [state.elements]);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'v':
                    setSelectedTool('select');
                    break;
                case 'c':
                    setSelectedTool('command');
                    break;
                case 'e':
                    setSelectedTool('event');
                    break;
                case 'r':
                    setSelectedTool('readmodel');
                    break;
                case 'p':
                    setSelectedTool('process');
                    break;
                case 'delete':
                case 'backspace':
                    if (state.selectedElementId) {
                        handleDeleteElement(state.selectedElementId);
                    } else if (state.selectedConnectorId) {
                        handleDeleteConnector(state.selectedConnectorId);
                    }
                    break;
                case '+':
                case '=':
                    handleZoomIn();
                    break;
                case '-':
                case '_':
                    handleZoomOut();
                    break;
                case '0':
                    handleZoomReset();
                    break;
                case 'f':
                    handleFitToView();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state, selectedTool, handleDeleteElement, handleDeleteConnector, handleZoomIn, handleZoomOut, handleZoomReset, handleFitToView]);

    return (
        <div className="event-modeling" style={{ width, height }}>
            <Toolbox
                selectedTool={selectedTool}
                onToolSelect={setSelectedTool}
            />
            <Canvas
                state={state}
                selectedTool={selectedTool}
                zoom={zoom}
                pan={pan}
                onZoomChange={handleZoomChange}
                onPanChange={handlePanChange}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onAddConnector={handleAddConnector}
                onSelectElement={handleSelectElement}
                onSelectConnector={handleSelectConnector}
            />
            <CanvasControls
                zoom={zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onZoomReset={handleZoomReset}
                onFitToView={handleFitToView}
            />
        </div>
    );
};
