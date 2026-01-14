// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useCallback } from 'react';
import { ElementType } from '../types';

export interface ToolboxProps {
    selectedTool: ElementType | 'select';
    onToolSelect: (tool: ElementType | 'select') => void;
    onDragStart?: (tool: ElementType, e: React.DragEvent) => void;
}

export const Toolbox: React.FC<ToolboxProps> = ({ selectedTool, onToolSelect, onDragStart }) => {
    const handleDragStart = useCallback((tool: ElementType, e: React.DragEvent) => {
        e.dataTransfer.setData('application/x-event-modeling-tool', tool);
        e.dataTransfer.effectAllowed = 'copy';
        if (onDragStart) {
            onDragStart(tool, e);
        }
    }, [onDragStart]);

    return (
        <div className="event-modeling-toolbox">
            <button
                className={`event-modeling-tool-button select ${selectedTool === 'select' ? 'selected' : ''}`}
                onClick={() => onToolSelect('select')}
                title="Select (V)"
            >
                <div className="event-modeling-tool-icon">⬆</div>
                <div>Select</div>
            </button>
            <button
                className={`event-modeling-tool-button command ${selectedTool === 'command' ? 'selected' : ''}`}
                onClick={() => onToolSelect('command')}
                draggable
                onDragStart={(e) => handleDragStart('command', e)}
                title="Command (C) - Click or drag to canvas"
            >
                <div className="event-modeling-tool-icon"></div>
                <div>Command</div>
            </button>
            <button
                className={`event-modeling-tool-button event ${selectedTool === 'event' ? 'selected' : ''}`}
                onClick={() => onToolSelect('event')}
                draggable
                onDragStart={(e) => handleDragStart('event', e)}
                title="Event (E) - Click or drag to canvas"
            >
                <div className="event-modeling-tool-icon"></div>
                <div>Event</div>
            </button>
            <button
                className={`event-modeling-tool-button readmodel ${selectedTool === 'readmodel' ? 'selected' : ''}`}
                onClick={() => onToolSelect('readmodel')}
                draggable
                onDragStart={(e) => handleDragStart('readmodel', e)}
                title="Read Model (R) - Click or drag to canvas"
            >
                <div className="event-modeling-tool-icon"></div>
                <div>View</div>
            </button>
            <button
                className={`event-modeling-tool-button process ${selectedTool === 'process' ? 'selected' : ''}`}
                onClick={() => onToolSelect('process')}
                draggable
                onDragStart={(e) => handleDragStart('process', e)}
                title="Process (P) - Click or drag to canvas"
            >
                <div className="event-modeling-tool-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                </div>
                <div>Process</div>
            </button>
        </div>
    );
};
