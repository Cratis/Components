// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Props for {@link EventsScrollButton}. */
export interface EventsScrollButtonProps {
    /** Which edge of the timeline the button scrolls to. */
    edge: 'top' | 'bottom';
    label: string;
    onClick: () => void;
}

/** A button floating at one edge of the events timeline that scrolls to that edge. */
export const EventsScrollButton = ({ edge, label, onClick }: EventsScrollButtonProps) => (
    <div className={`events-view-scroll-button-wrapper events-view-scroll-button-wrapper--${edge}`}>
        <button
            type='button'
            className={`events-view-scroll-button events-view-scroll-button--${edge}`}
            onClick={onClick}
            aria-label={label}
        >
            {edge === 'top' ? '↑' : '↓'}
        </button>
    </div>
);
