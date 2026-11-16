// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    createContext,
    useContext,
    type HTMLAttributes,
} from 'react';
import { type TimeMachineLabels, defaultTimeMachineLabels } from './TimeMachineLabels';
import { EventsScrollButton } from './EventsScrollButton';
import { EventTimelineItem } from './EventTimelineItem';
import { useScrollEdges } from './useScrollEdges';
import type { Event } from './types';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { classNames } from '../ClassNames/classNames';

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

const eventsViewPartsMatchManifest: ExactPartKeys<EventsViewParts, PartsOf<'EventsView'>> = true;
void eventsViewPartsMatchManifest;

/** Props for the standalone, localized event timeline. */
export interface EventsViewProps {
    /** Ordered list of domain events to render in the vertical timeline. */
    events: Event[];
    /** CSS class name applied to the timeline root. */
    className?: string;
    /** Cratis-owned per-part attributes for timeline, event, separator, marker, connector, content. */
    pt?: EventsViewParts;
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
    unstyled?: boolean;
    /** Override any user-facing string (for localization). See {@link TimeMachineLabels}. */
    labels?: TimeMachineLabels;
}

export const SelectedEventSequenceNumbersContext =
    createContext<ReadonlySet<number> | undefined>(undefined);

/** Vertical, alternating timeline visualization of an ordered event list. */
export const EventsView = ({
    events,
    className,
    pt,
    labels = defaultTimeMachineLabels,
}: EventsViewProps) => {
    const selectedEventSequenceNumbers = useContext(
        SelectedEventSequenceNumbersContext,
    );
    const { containerRef, canScrollUp, canScrollDown, scrollToTop, scrollToBottom } =
        useScrollEdges(events.length);

    return (
        <div
            className='events-view-container'
            ref={containerRef}
            role='group'
            aria-label={labels.eventTimelineRegion}
            tabIndex={0}
        >
            {canScrollUp && (
                <EventsScrollButton edge='top' label={labels.scrollToTop} onClick={scrollToTop} />
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
                {events.map((event, index) => (
                    <EventTimelineItem
                        key={`${event.type}-${event.occurred.toISOString()}-${index}`}
                        event={event}
                        position={index % 2 === 0 ? 'right' : 'left'}
                        isSelected={selectedEventSequenceNumbers?.has(event.sequenceNumber)}
                        hasConnector={index < events.length - 1}
                        pt={pt}
                    />
                ))}
            </div>
            {canScrollDown && (
                <EventsScrollButton edge='bottom' label={labels.scrollToBottom} onClick={scrollToBottom} />
            )}
        </div>
    );
};
