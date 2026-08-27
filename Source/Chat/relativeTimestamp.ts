// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Overrides for the strings {@link relativeTimestamp} composes. `{minutes}`/`{hours}` are substituted. */
export interface RelativeTimestampLabels {
    /** Under a minute ago. Defaults to `'just now'`. */
    justNow?: string;

    /** Under an hour ago. Defaults to `'{minutes}m ago'`. */
    minutesAgo?: string;

    /** Under a day ago. Defaults to `'{hours}h ago'`. */
    hoursAgo?: string;
}

/**
 * A short relative rendering of a moment — `just now`, `5m ago`, `3h ago`, and a locale date
 * once it is older than a day.
 * @param moment The moment to render. Data that traveled through JSON may carry it as a string, so it is coerced rather than trusted to be a `Date`.
 * @param now What time it is, injectable so specs are not tied to the wall clock.
 * @param labels Overrides for the composed strings. Unset fields fall back to literal English defaults.
 * @returns The relative rendering.
 */
export const relativeTimestamp = (
    moment: Date,
    now: Date = new Date(),
    labels?: RelativeTimestampLabels,
): string => {
    const date = moment instanceof Date ? moment : new Date(moment);
    const differenceInMinutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
    if (differenceInMinutes < 1) return labels?.justNow ?? 'just now';
    if (differenceInMinutes < 60)
        return (labels?.minutesAgo ?? '{minutes}m ago').replace(
            '{minutes}',
            differenceInMinutes.toString(),
        );
    const differenceInHours = Math.floor(differenceInMinutes / 60);
    if (differenceInHours < 24)
        return (labels?.hoursAgo ?? '{hours}h ago').replace(
            '{hours}',
            differenceInHours.toString(),
        );
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
