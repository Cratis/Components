// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * User-facing strings for {@link TimeMachine} and its sub-views. Every field is
 * optional at the call site; pass a partial `labels` to override any (for
 * localization). Omitted fields fall back to {@link defaultTimeMachineLabels}
 * (English).
 */
export interface TimeMachineLabels {
    /** Accessible name for the read-model view toggle. */
    readModelView: string;
    /** Accessible name for the events view toggle. */
    eventsView: string;
    /** Accessible name for the previous-version control. */
    previousVersion: string;
    /** Accessible name for the next-version control. */
    nextVersion: string;
    /** Accessible name for the "show related events" control. */
    showRelatedEvents: string;
    /** Accessible name for the "show read-model snapshot" control. */
    showReadModelSnapshot: string;
    /** Accessible name for the "scroll to top" control. */
    scrollToTop: string;
    /** Accessible name for the "scroll to bottom" control. */
    scrollToBottom: string;
}

/** English defaults for {@link TimeMachineLabels}. */
export const defaultTimeMachineLabels: TimeMachineLabels = {
    readModelView: 'Read Model View',
    eventsView: 'Events View',
    previousVersion: 'Previous version',
    nextVersion: 'Next version',
    showRelatedEvents: 'Show related events',
    showReadModelSnapshot: 'Show read model snapshot',
    scrollToTop: 'Scroll to top',
    scrollToBottom: 'Scroll to bottom',
};
