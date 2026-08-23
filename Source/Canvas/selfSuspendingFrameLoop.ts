// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

type FrameScheduler = (callback: (now: number) => void) => number;
type FrameCanceler = (handle: number) => void;

export interface SelfSuspendingFrameLoop {
    // Whether a frame is currently scheduled.
    readonly isRunning: boolean;

    // Starts the loop if it is not already running; a running loop is left alone, so waking is
    // safe to do on every trigger however bursty.
    wake(): void;

    // Cancels the scheduled frame, if any. The loop can be woken again afterwards.
    stop(): void;
}

// An animation-frame loop that runs only while its step reports motion left to follow, instead of
// burning a callback every frame forever (the board-page idle drain of StudioIssues#200). The step
// runs once per frame and returns whether another frame is needed; when it returns false the loop
// suspends until the next wake(). The scheduler is injectable so the suspension logic can be
// specified without a browser.
export const createSelfSuspendingFrameLoop = (
    step: (now: number) => boolean,
    schedule: FrameScheduler = callback => requestAnimationFrame(callback),
    cancel: FrameCanceler = handle => cancelAnimationFrame(handle),
): SelfSuspendingFrameLoop => {
    let handle: number | undefined;

    const frame = (now: number) => {
        handle = undefined;
        if (step(now)) {
            handle = schedule(frame);
        }
    };

    return {
        get isRunning(): boolean {
            return handle !== undefined;
        },

        wake(): void {
            handle ??= schedule(frame);
        },

        stop(): void {
            if (handle !== undefined) {
                cancel(handle);
                handle = undefined;
            }
        },
    };
};
