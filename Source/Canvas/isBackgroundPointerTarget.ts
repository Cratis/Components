// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// A real drag handle (module/feature/slice headers, row labels, sticky notes, link connectors, ...)
// always claims its own gesture with stopPropagation before it can bubble up to the canvas — so by
// the time a touch pointerdown reaches the canvas, it is never one of those, and a single finger
// anywhere else should pan rather than be silently swallowed by whatever content sits under it.
// Mouse/pen keep the strict check: only the bare container or its rendering canvas count as background.
export function isBackgroundPointerTarget(
    pointerType: string,
    readOnly: boolean,
    target: EventTarget | null,
    container: EventTarget | null,
): boolean {
    if (readOnly || pointerType === 'touch') return true;
    if (target === container) return true;
    return (target as HTMLElement | null)?.tagName === 'CANVAS';
}
