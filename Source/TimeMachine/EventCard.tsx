// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Properties } from './Properties';
import type { Event } from './types';

/** Props for {@link EventCard}. */
export interface EventCardProps {
    event: Event;
    position: 'left' | 'right';
}

const alignedClass = (base: string, position: 'left' | 'right') =>
    `${base} ${position === 'left' ? `${base}--right` : ''}`;

/** The card of one timeline event: type, timestamp and properties. */
export const EventCard = ({ event, position }: EventCardProps) => (
    <div className={`events-view-event-card events-view-event-card--${position}`}>
        <div className={alignedClass('events-view-event-header', position)}>
            <h3 className={alignedClass('events-view-event-name', position)}>
                {event.type}
            </h3>
            <div className={alignedClass('events-view-event-timestamp', position)}>
                {event.occurred.toLocaleString()}
            </div>
        </div>
        <div className='events-view-event-properties'>
            <Properties data={event.content || {}} align='left' />
        </div>
    </div>
);
