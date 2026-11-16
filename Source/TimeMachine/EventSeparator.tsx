// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import type { EventsViewParts } from './EventsView';

/** Props for {@link EventSeparator}. */
export interface EventSeparatorProps {
    isSelected: boolean | undefined;
    /** Whether a connector line follows the marker. */
    hasConnector: boolean;
    pt?: EventsViewParts;
}

/** The timeline spine segment of one event: its marker and the connector to the next event. */
export const EventSeparator = ({ isSelected, hasConnector, pt }: EventSeparatorProps) => (
    <div
        {...pt?.separator}
        className={classNames('events-view-timeline-separator', pt?.separator?.className)}
        data-cratis-part='separator'
    >
        <div
            {...pt?.marker}
            className={classNames('events-view-marker', pt?.marker?.className)}
            data-cratis-part='marker'
            data-selected={isSelected || undefined}
        >
            <div className='events-view-marker-dot' />
        </div>
        {hasConnector && (
            <div
                {...pt?.connector}
                className={classNames('events-view-timeline-connector', pt?.connector?.className)}
                data-cratis-part='connector'
            />
        )}
    </div>
);
