// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import type { Event } from './types';
import { type TimeMachineLabels, defaultTimeMachineLabels } from './TimeMachineLabels';
import { Properties } from './Properties';

/** Stable part attributes for {@link EventsView}. */
export interface EventsViewParts {
    /** Scrollable container wrapping the entire vertical timeline. */
    timeline?: HTMLAttributes<HTMLDivElement>;
    /** One timeline event article element with `data-position` (left/right). */
    event?: HTMLAttributes<HTMLElement>;
    /** Separator column containing the marker and optional connector line. */
    separator?: HTMLAttributes<HTMLDivElement>;
    /** Event marker (the circular dot on the timeline spine). */
    marker?: HTMLAttributes<HTMLDivElement>;
    /** Vertical line connecting consecutive event markers. */
    connector?: HTMLAttributes<HTMLDivElement>;
    /** Content panel showing the event card (type, timestamp, properties). */
    content?: HTMLAttributes<HTMLDivElement>;
}

/** Props for the standalone, localized event timeline. */
export interface EventsViewProps {
    /** Ordered list of domain events to render in the vertical timeline. */
    events: Event[];
    /** CSS class name applied to the timeline root. */
    className?: string;
    /** Cratis-owned per-part attributes for timeline, event, separator, marker, connector, content. */
    pt?: EventsViewParts;
    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;
    /** Retained for source compatibility; consumers always own the CSS. */
    unstyled?: boolean;
    /** Override any user-facing string (for localization). See {@link TimeMachineLabels}. */
    labels?: TimeMachineLabels;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/** Vertical, alternating timeline visualization of an ordered event list. */
export const EventsView = ({
    events,
    className,
    pt,
    labels = defaultTimeMachineLabels,
}: EventsViewProps) => {
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
        setCanScrollUp(scrollTop > 1);
        setCanScrollDown(scrollTop + clientHeight < scrollHeight - 1);
    };

    useEffect(() => {
        updateScrollState();
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('scroll', updateScrollState);
        return () => container.removeEventListener('scroll', updateScrollState);
    }, [events.length]);

    const scrollBehavior = (): ScrollBehavior =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const scrollToTop = () =>
        containerRef.current?.scrollTo({ top: 0, behavior: scrollBehavior() });
    const scrollToBottom = () => {
        const container = containerRef.current;
        if (container)
            container.scrollTo({
                top: container.scrollHeight,
                behavior: scrollBehavior(),
            });
    };

    return (
        <div className='events-view-container' ref={containerRef}>
            {canScrollUp && (
                <div className='events-view-scroll-button-wrapper events-view-scroll-button-wrapper--top'>
                    <button
                        type='button'
                        className='events-view-scroll-button events-view-scroll-button--top'
                        onClick={scrollToTop}
                        aria-label={labels.scrollToTop}
                    >
                        ↑
                    </button>
                </div>
            )}
            <div
                {...pt?.timeline}
                className={classNames(
                    'events-view-timeline',
                    pt?.timeline?.className,
                    className,
                )}
                data-cratis-part='timeline'
            >
                {events.map((event, index) => {
                    const position = index % 2 === 0 ? 'right' : 'left';
                    return (
                        <article
                            {...pt?.event}
                            key={`${event.type}-${event.occurred.toISOString()}-${index}`}
                            className={classNames(
                                'events-view-timeline-event',
                                pt?.event?.className,
                            )}
                            data-cratis-part='event'
                            data-position={position}
                        >
                            <div
                                {...pt?.separator}
                                className={classNames(
                                    'events-view-timeline-separator',
                                    pt?.separator?.className,
                                )}
                                data-cratis-part='separator'
                            >
                                <div
                                    {...pt?.marker}
                                    className={classNames(
                                        'events-view-marker',
                                        pt?.marker?.className,
                                    )}
                                    data-cratis-part='marker'
                                >
                                    <div className='events-view-marker-dot' />
                                </div>
                                {index < events.length - 1 && (
                                    <div
                                        {...pt?.connector}
                                        className={classNames(
                                            'events-view-timeline-connector',
                                            pt?.connector?.className,
                                        )}
                                        data-cratis-part='connector'
                                    />
                                )}
                            </div>
                            <div
                                {...pt?.content}
                                className={classNames(
                                    'events-view-timeline-content',
                                    pt?.content?.className,
                                )}
                                data-cratis-part='content'
                            >
                                <div
                                    className={`events-view-event-card events-view-event-card--${position}`}
                                >
                                    <div
                                        className={`events-view-event-header ${position === 'left' ? 'events-view-event-header--right' : ''}`}
                                    >
                                        <h3
                                            className={`events-view-event-name ${position === 'left' ? 'events-view-event-name--right' : ''}`}
                                        >
                                            {event.type}
                                        </h3>
                                        <div
                                            className={`events-view-event-timestamp ${position === 'left' ? 'events-view-event-timestamp--right' : ''}`}
                                        >
                                            {event.occurred.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className='events-view-event-properties'>
                                        <Properties
                                            data={event.content || {}}
                                            align='left'
                                        />
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
            {canScrollDown && (
                <div className='events-view-scroll-button-wrapper events-view-scroll-button-wrapper--bottom'>
                    <button
                        type='button'
                        className='events-view-scroll-button events-view-scroll-button--bottom'
                        onClick={scrollToBottom}
                        aria-label={labels.scrollToBottom}
                    >
                        ↓
                    </button>
                </div>
            )}
        </div>
    );
};
