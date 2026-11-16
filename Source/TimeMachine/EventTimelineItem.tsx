// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import { EventCard } from './EventCard';
import { EventSeparator } from './EventSeparator';
import type { EventsViewParts } from './EventsView';
import type { Event } from './types';

/** Props for {@link EventTimelineItem}. */
export interface EventTimelineItemProps {
    event: Event;
    position: 'left' | 'right';
    isSelected: boolean | undefined;
    /** Whether a connector line follows this event. */
    hasConnector: boolean;
    pt?: EventsViewParts;
}

/** One event on the timeline: separator with marker and connector, and the event card. */
export const EventTimelineItem = ({ event, position, isSelected, hasConnector, pt }: EventTimelineItemProps) => (
    <article
        {...pt?.event}
        className={classNames('events-view-timeline-event', pt?.event?.className)}
        data-cratis-part='event'
        data-position={position}
        data-selected={isSelected || undefined}
    >
        <EventSeparator isSelected={isSelected} hasConnector={hasConnector} pt={pt} />
        <div
            {...pt?.content}
            className={classNames('events-view-timeline-content', pt?.content?.className)}
            data-cratis-part='content'
        >
            <EventCard event={event} position={position} />
        </div>
    </article>
);
