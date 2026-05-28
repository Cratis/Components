// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import type { Version } from './types';
import { Properties } from './Properties';

/**
 * Props for {@link ReadModelView}.
 */
interface ReadModelViewProps {
    /** Ordered list of read-model versions to display. */
    versions: Version[];

    /** Index of the currently-selected (committed) version. */
    selectedIndex: number;

    /**
     * Index of the currently-hovered version, or `null` when nothing is hovered.
     * Used to preview a version without committing the selection.
     */
    hoveredIndex: number | null;

    /** Invoked when the user clicks a version card to select it. */
    onVersionSelect: (index: number) => void;

    /**
     * Invoked when the hover state over any card changes — true on enter,
     * false on leave. Lets the parent coordinate the surrounding chrome with
     * the hover state.
     */
    onHoveringCardChange: (isHovering: boolean) => void;
}

/**
 * Visual representation of a read-model's version history as a row of
 * flippable "window" cards. Each card shows the read-model state at that
 * version on its front face and can be flipped to reveal additional metadata.
 *
 * Selection and hover are externally controlled so the parent {@link TimeMachine}
 * can synchronize the read-model view with the events timeline.
 *
 * @param props - {@link ReadModelViewProps}.
 */
export const ReadModelView: React.FC<ReadModelViewProps> = ({
    versions,
    selectedIndex,
    hoveredIndex,
    onVersionSelect,
    onHoveringCardChange,
}) => {
    const displayIndex = hoveredIndex ?? selectedIndex;
    const [flippedMap, setFlippedMap] = useState<Record<string, boolean>>({});

    const toggleFlip = (id: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setFlippedMap(previous => ({
            ...previous,
            [id]: !previous[id]
        }));
    };

    return (
        <>
            {/* Starfield background */}
            <div className="time-machine-background">
                <div className="stars"></div>
                <div className="stars stars-2"></div>
                <div className="stars stars-3"></div>
            </div>

            {/* 3D Stacked Windows */}
            <div className="time-machine-viewport">
                <div className="windows-container">
                    {versions.map((version, index) => {
                        const depth = index - displayIndex;
                        const isActive = index === displayIndex;
                        const isVisible = depth >= 0 && depth < 10;
                        const isFlipped = flippedMap[version.id] ?? false;

                        if (!isVisible) return null;

                        // Only prepare events for the active version to avoid showing all events at once
                        const events = isActive && version.events?.length
                            ? version.events.map(event => ({
                                ...event,
                                occurred: new Date(event.occurred)
                            }))
                            : [];

                        return (
                            <div
                                key={version.id}
                                className={`version-window ${isActive ? 'active' : ''} ${isFlipped ? 'flipped' : ''}`}
                                style={{
                                    '--depth': depth,
                                    '--z-offset': -depth * 150,
                                    '--scale': 1 - depth * 0.05,
                                    '--opacity': 1 - depth * 0.12,
                                } as React.CSSProperties}
                                onClick={() => onVersionSelect(index)}
                                onMouseEnter={() => onHoveringCardChange(true)}
                                onMouseLeave={() => onHoveringCardChange(false)}
                            >
                                <div className="version-window-inner">
                                    <div className="version-window-face version-window-face--front">
                                        <div className="window-chrome">
                                            <div className="window-controls">
                                                <span className="control close"></span>
                                                <span className="control minimize"></span>
                                                <span className="control maximize"></span>
                                            </div>
                                            <div className="window-title">{version.label}</div>
                                            <div className="window-actions">
                                                <button
                                                    type="button"
                                                    className="window-flip-button"
                                                    onClick={toggleFlip(version.id)}
                                                    aria-label="Show related events"
                                                    aria-pressed={isFlipped}
                                                >
                                                    <i className={`pi ${isFlipped ? 'pi-undo' : 'pi-refresh'}`} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="window-content">
                                            {version.content}
                                        </div>
                                    </div>
                                    <div className="version-window-face version-window-face--back">
                                        <div className="window-chrome window-chrome--back">
                                            <div className="window-controls">
                                                <span className="control close"></span>
                                                <span className="control minimize"></span>
                                                <span className="control maximize"></span>
                                            </div>
                                            <div className="window-title">Related Events</div>
                                            <div className="window-actions">
                                                <button
                                                    type="button"
                                                    className="window-flip-button"
                                                    onClick={toggleFlip(version.id)}
                                                    aria-label="Show read model snapshot"
                                                    aria-pressed={isFlipped}
                                                >
                                                    <i className={`pi ${isFlipped ? 'pi-undo' : 'pi-refresh'}`} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="window-content window-content--events">
                                            <div className="snapshot-event-list">
                                                {events.map((event, eventIndex) => (
                                                    <div key={`${version.id}-${event.sequenceNumber ?? eventIndex}`} className="snapshot-event">
                                                        <div className="snapshot-event-header">
                                                            <span className="snapshot-event-name">{event.type}</span>
                                                            <span className="snapshot-event-timestamp">{event.occurred.toLocaleString()}</span>
                                                        </div>
                                                        <Properties data={event.content} align="left" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
