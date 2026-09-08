// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A historical snapshot of an entity at a point in time, holding the read-model state
 * and optionally the events that produced it.
 */
export interface Version {
    /** Unique identifier for this version snapshot. */
    id: string;
    /** Wall-clock timestamp when this version was captured. */
    timestamp: Date;
    /** User-facing label describing this version (e.g. "Initial Registration", "Updated Profile"). */
    label: string;
    /** Rendered read-model state at this point in time (typically a {@link Properties} table). */
    content: React.ReactNode;
    /** Domain events that produced this version, rendered in {@link EventsView}. */
    events?: Event[];
}

/**
 * A domain event rendered in the vertical timeline.
 * Represents one immutable fact appended to the event log.
 */
export interface Event {
    /** Event sequence number in the event log (determines timeline order). */
    sequenceNumber: number;
    /** Event type name (e.g. "AuthorRegistered", "ProfileUpdated"). */
    type: string;
    /** Wall-clock timestamp when this event occurred. */
    occurred: Date;
    /** Event payload (property bag) rendered by {@link Properties}. */
    content: Record<string, unknown>;
}

/**
 * A single entry in the fish-eye timeline scrubber.
 * A lightweight version reference without the full read-model snapshot.
 */
export interface TimelineEntry {
    /** Unique identifier for this timeline entry (typically the same as {@link Version.id}). */
    id: string;
    /** Wall-clock timestamp for this timeline tick. */
    timestamp: Date;
    /** User-facing label shown when hovering over this timeline entry. */
    label: string;
}
