// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useEffect, useRef, useState } from 'react';
import { Timeline, type TimelineProps } from 'primereact/timeline';
import type { Event } from './types';
import { Properties } from './Properties';
import './EventsView.css';

/**
 * Props for {@link EventsView}.
 */
interface EventsViewProps {
    /** The events to display, in chronological order. */
    events: Event[];

    /** Extra CSS class name forwarded to the underlying Timeline, alongside the component's own. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying Timeline. */
    pt?: TimelineProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Timeline. */
    ptOptions?: TimelineProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Timeline. */
    unstyled?: boolean;
}

/**
 * Vertical timeline visualization of an ordered list of Cratis events.
 * Renders each event on alternating sides of a central spine with its
 * properties shown in a popup, and tracks scroll boundaries so up/down
 * arrows appear only when there's content to scroll to.
 *
 * Used inside {@link TimeMachine} to show the events that produced a given
 * read-model version, but can be reused for any event timeline UI.
 *
 * @param props - {@link EventsViewProps}.
 */
export const EventsView: React.FC<EventsViewProps> = ({ events, className, pt, ptOptions, unstyled }) => {
    // Use test data if no events provided
    const displayEvents = events.length > 0 ? events : [];
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const updateScrollState = () => {
        const container = containerRef.current;
        if (!container) {
            setCanScrollUp(false);
            setCanScrollDown(false);
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = container;
        const epsilon = 1;
        setCanScrollUp(scrollTop > epsilon);
        setCanScrollDown(scrollTop + clientHeight < scrollHeight - epsilon);
    };

    useEffect(() => {
        updateScrollState();
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => updateScrollState();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [displayEvents.length]);

    const renderEventCard = (event: Event, position: 'left' | 'right') => {
        const isLeft = position === 'left';

        return (
            <div className={`events-view-event-card events-view-event-card--${position}`}>
                <div className={`events-view-event-header ${isLeft ? 'events-view-event-header--right' : ''}`}>
                    <h3 className={`events-view-event-name ${isLeft ? 'events-view-event-name--right' : ''}`}>{event.type}</h3>
                    <div className={`events-view-event-timestamp ${isLeft ? 'events-view-event-timestamp--right' : ''}`}>
                        {event.occurred.toLocaleString()}
                    </div>
                </div>
                <div className="events-view-event-properties">
                    <Properties data={event.content || {}} align="left" />
                </div>
            </div>
        );
    };

    const customContent = (event: Event, index: number) => {
        // PrimeReact places even indices (0,2,4,...) on the right, odd on the left
        const position = index % 2 === 0 ? 'right' : 'left';
        return renderEventCard(event, position);
    };

    const customMarker = () => {
        return (
            <div className="events-view-marker">
                <div className="events-view-marker-dot"></div>
            </div>
        );
    };

    const scrollToTop = () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollToBottom = () => {
        const container = containerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    };

    return (
        <div className="events-view-container" ref={containerRef}>
            {canScrollUp && (
                <div className="events-view-scroll-button-wrapper events-view-scroll-button-wrapper--top">
                    <button
                        type="button"
                        className="events-view-scroll-button events-view-scroll-button--top"
                        onClick={scrollToTop}
                        aria-label="Scroll to top"
                    >
                        <i className="pi pi-arrow-up" />
                    </button>
                </div>
            )}
            <Timeline
                value={displayEvents}
                align="alternate"
                content={customContent}
                marker={customMarker}
                className={className ? `events-view-timeline ${className}` : 'events-view-timeline'}
                pt={pt}
                ptOptions={ptOptions}
                unstyled={unstyled}
            />
            {canScrollDown && (
                <div className="events-view-scroll-button-wrapper events-view-scroll-button-wrapper--bottom">
                    <button
                        type="button"
                        className="events-view-scroll-button events-view-scroll-button--bottom"
                        onClick={scrollToBottom}
                        aria-label="Scroll to bottom"
                    >
                        <i className="pi pi-arrow-down" />
                    </button>
                </div>
            )}
        </div>
    );
};
