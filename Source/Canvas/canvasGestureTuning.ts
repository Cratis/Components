// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export const ZOOM_INTENSITY = 0.008;

// How long after the last wheel event a gesture counts as settled - the moment the crisp resting zoom is
// re-applied and the held-back virtualization updates flush.
export const GESTURE_SETTLE_MS = 150;

// A trackpad's momentum comes for free — the OS keeps delivering decaying wheel events after the
// fingers lift. A touch drag has no such thing: `touch-action: none` hands the whole gesture to us,
// so lifting a finger stops the pan dead unless we fake the same decay ourselves. These tune that feel.
// Only samples within this trailing window (from the drag's last moment, not its whole history)
// contribute to the release velocity, so a drag that was moving fast but came to rest before the
// finger actually lifted correctly produces no momentum.
export const MOMENTUM_SAMPLE_WINDOW_MS = 100;

// Below this speed (px/ms) momentum is imperceptible — used both to skip starting it on a slow
// release and to end the decay loop once it coasts down to a stop.
export const MOMENTUM_MIN_VELOCITY = 0.02;

// Exponential decay rate, chosen so velocity halves roughly every 200ms — fast enough to feel
// responsive, slow enough to read as a coast rather than a snap.
export const MOMENTUM_FRICTION = 0.0035;
