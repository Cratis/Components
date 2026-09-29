// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The easing curve for programmatic camera moves: a cubic ease-in-out, so the camera picks up speed gently
 * and settles gently instead of starting at full tilt — the difference between a camera move and a yank.
 * @param progress Linear progress through the animation, 0 to 1.
 * @returns The eased progress.
 */
export function easeInOutCubic(progress: number): number {
    return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - (-2 * progress + 2) ** 3 / 2;
}
