// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A pointer position in viewport (client) coordinates, timestamped for velocity calculation. */
export interface PanSample {

    x: number;

    y: number;

    /** The time the sample was taken, from the same clock as every other sample (performance.now()). */
    time: number;
}

/** A pan velocity in pixels per millisecond. */
export interface PanVelocity {

    x: number;

    y: number;
}

/**
 * Drops samples older than windowMs, measured from the newest one — the trailing window a touch pan's
 * release velocity is read from, so a drag that was moving fast earlier but came to rest before the
 * finger actually lifted correctly produces no momentum. Always keeps at least one sample.
 */
export function trimSamples(samples: PanSample[], windowMs: number): PanSample[] {
    const trimmed = [...samples];
    const newest = trimmed[trimmed.length - 1];
    if (!newest) return trimmed;

    while (trimmed.length > 1 && newest.time - trimmed[0].time > windowMs) {
        trimmed.shift();
    }

    return trimmed;
}

/**
 * The release velocity implied by the oldest and newest sample in the window, or null when there are
 * too few samples, they carry no time delta, or the release was slower than minVelocity — too slow for
 * momentum to be worth animating.
 */
export function velocityFromSamples(samples: PanSample[], minVelocity: number): PanVelocity | null {
    if (samples.length < 2) return null;

    const first = samples[0];
    const last = samples[samples.length - 1];
    const elapsedMs = last.time - first.time;
    if (elapsedMs <= 0) return null;

    const velocity = { x: (last.x - first.x) / elapsedMs, y: (last.y - first.y) / elapsedMs };
    return Math.hypot(velocity.x, velocity.y) >= minVelocity ? velocity : null;
}

/** Decays a velocity exponentially over elapsedMs at the given friction rate. */
export function decayVelocity(velocity: PanVelocity, elapsedMs: number, friction: number): PanVelocity {
    const decay = Math.exp(-friction * elapsedMs);
    return { x: velocity.x * decay, y: velocity.y * decay };
}
