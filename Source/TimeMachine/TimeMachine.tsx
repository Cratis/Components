// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Version } from './types';
import { ReadModelView } from './ReadModelView';
import { EventsView } from './EventsView';
import { type TimeMachineLabels, defaultTimeMachineLabels } from './TimeMachineLabels';
import { FaBoxArchive, FaList } from 'react-icons/fa6';
import { useLocale } from 'react-aria-components/I18nProvider';

enum ViewModes {
    ReadModel = 'ReadModel',
    Events = 'Events',
}

/** Props for the localized, keyboard-accessible event/read-model timeline. */
export interface TimeMachineProps {
    versions: Version[];
    currentVersionIndex?: number;
    onVersionChange?: (index: number) => void;
    /** Scroll sensitivity - higher values require more scrolling to change versions */
    scrollSensitivity?: number;
    /** Override any user-facing string (for localization). See {@link TimeMachineLabels}. */
    labels?: Partial<TimeMachineLabels>;
}

export const TimeMachine: React.FC<TimeMachineProps> = ({
    versions,
    currentVersionIndex = 0,
    onVersionChange,
    scrollSensitivity = 50,
    labels,
}) => {
    const l = { ...defaultTimeMachineLabels, ...labels };
    const [selectedIndex, setSelectedIndex] = useState(currentVersionIndex);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isHoveringCard, setIsHoveringCard] = useState(false);
    const [viewMode, setViewMode] = useState<ViewModes>(ViewModes.ReadModel);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollAccumulatorRef = useRef(0);

    const handleVersionSelect = useCallback(
        (index: number) => {
            setSelectedIndex(index);
            onVersionChange?.(index);
        },
        [onVersionChange],
    );

    const handleTimelineHover = useCallback((index: number | null) => {
        setHoveredIndex(index);
    }, []);

    // Handle trackpad two-finger scroll gesture
    useEffect(() => {
        if (viewMode !== ViewModes.ReadModel) {
            return;
        }

        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // Only handle navigation when not hovering over a card
            if (isHoveringCard) {
                return; // Allow normal scrolling within cards
            }

            // Prevent default scrolling behavior
            e.preventDefault();

            // Use deltaX for horizontal scroll, fallback to deltaY for vertical
            // Most trackpads send horizontal delta for two-finger swipe
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

            // Accumulate scroll delta
            scrollAccumulatorRef.current += delta;

            // Check if we've accumulated enough scroll to change version
            if (Math.abs(scrollAccumulatorRef.current) >= scrollSensitivity) {
                const direction = scrollAccumulatorRef.current > 0 ? 1 : -1;
                const newIndex = Math.max(
                    0,
                    Math.min(versions.length - 1, selectedIndex + direction),
                );

                if (newIndex !== selectedIndex) {
                    setSelectedIndex(newIndex);
                    onVersionChange?.(newIndex);
                }

                // Reset accumulator after version change
                scrollAccumulatorRef.current = 0;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [
        versions.length,
        selectedIndex,
        onVersionChange,
        scrollSensitivity,
        isHoveringCard,
        viewMode,
    ]);

    // Calculate the display index - either hovered or selected
    // (not used in this component; ReadModelView computes its own display index)
    void hoveredIndex;
    void selectedIndex;

    // Get all events from all versions
    const allEvents = versions.flatMap((version) => version.events || []);

    return (
        <div className='time-machine' ref={containerRef}>
            {/* View Switcher */}
            <div className='view-switcher'>
                <button
                    type='button'
                    className={`view-button ${viewMode === ViewModes.ReadModel ? 'active' : ''}`}
                    onClick={() => setViewMode(ViewModes.ReadModel)}
                    aria-label={l.readModelView}
                    title={l.readModelView}
                >
                    <FaBoxArchive aria-hidden='true' />
                </button>
                <button
                    type='button'
                    className={`view-button ${viewMode === ViewModes.Events ? 'active' : ''}`}
                    onClick={() => setViewMode(ViewModes.Events)}
                    aria-label={l.eventsView}
                    title={l.eventsView}
                >
                    <FaList aria-hidden='true' />
                </button>
            </div>

            {/* Render the appropriate view */}
            {viewMode === ViewModes.ReadModel ? (
                <ReadModelView
                    versions={versions}
                    selectedIndex={selectedIndex}
                    hoveredIndex={hoveredIndex}
                    onVersionSelect={handleVersionSelect}
                    onHoveringCardChange={setIsHoveringCard}
                    labels={l}
                />
            ) : (
                <EventsView events={allEvents} labels={l} />
            )}

            {/* Timeline - only show in ReadModel view */}
            {viewMode === ViewModes.ReadModel && (
                <Timeline
                    versions={versions}
                    selectedIndex={selectedIndex}
                    hoveredIndex={hoveredIndex}
                    onSelect={handleVersionSelect}
                    onHover={handleTimelineHover}
                />
            )}

            {/* Navigation arrows - only show in ReadModel view */}
            {viewMode === ViewModes.ReadModel && (
                <div className='navigation-controls'>
                    <button
                        type='button'
                        className='nav-button prev'
                        disabled={selectedIndex === 0}
                        onClick={() =>
                            handleVersionSelect(Math.max(0, selectedIndex - 1))
                        }
                        aria-label={l.previousVersion}
                    >
                        ‹
                    </button>
                    <button
                        type='button'
                        className='nav-button next'
                        disabled={selectedIndex === versions.length - 1}
                        onClick={() =>
                            handleVersionSelect(
                                Math.min(versions.length - 1, selectedIndex + 1),
                            )
                        }
                        aria-label={l.nextVersion}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
};

interface TimelineProps {
    versions: Version[];
    selectedIndex: number;
    hoveredIndex: number | null;
    onSelect: (index: number) => void;
    onHover: (index: number | null) => void;
}

const Timeline: React.FC<TimelineProps> = ({
    versions,
    selectedIndex,
    hoveredIndex,
    onSelect,
    onHover,
}) => {
    const { locale } = useLocale();

    const getMagnification = (index: number, hoverIdx: number | null): number => {
        if (hoverIdx === null) return 1;
        const distance = Math.abs(index - hoverIdx);
        // Fish-eye effect: items close to hover get magnified
        if (distance === 0) return 2.0;
        if (distance === 1) return 1.6;
        if (distance === 2) return 1.3;
        if (distance === 3) return 1.1;
        return 1;
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString(locale, {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    return (
        <div className='timeline'>
            <div className='timeline-track'>
                {versions.map((version, index) => {
                    const magnification = getMagnification(index, hoveredIndex);
                    const isSelected = index === selectedIndex;
                    const isHovered = index === hoveredIndex;

                    return (
                        <button
                            key={version.id}
                            type='button'
                            className={`timeline-entry ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                            style={
                                {
                                    '--magnification': magnification,
                                } as React.CSSProperties
                            }
                            onMouseEnter={() => onHover(index)}
                            onMouseLeave={() => onHover(null)}
                            onFocus={() => onHover(index)}
                            onBlur={() => onHover(null)}
                            onClick={() => onSelect(index)}
                            aria-pressed={isSelected}
                            aria-label={`${formatDate(version.timestamp)} ${formatTime(version.timestamp)}`}
                        >
                            <div className='timeline-tick'></div>
                            <div className='timeline-label'>
                                <span className='timeline-date'>
                                    {formatDate(version.timestamp)}
                                </span>
                                <span className='timeline-time'>
                                    {formatTime(version.timestamp)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default TimeMachine;
