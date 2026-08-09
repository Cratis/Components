// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';

/**
 * Hook that keeps a PrimeReact overlay panel at or above a minimum z-index.
 *
 * PrimeReact computes overlay z-indexes relative to whatever is currently open — in an application that
 * configures the PrimeReact z-index tiers this already stacks panels above dialogs correctly. This hook is
 * the safety net for applications that do not: when PrimeReact's computed value is *below* the floor, the
 * panel is raised to it.
 *
 * It is strictly raise-only. It must never lower a value PrimeReact computed, for two reasons: the computed
 * value is what stacks the panel above an open dialog's mask, and PrimeReact's `ZIndexUtils.clear()`
 * un-registers an overlay by reading its inline z-index back — overwriting it with a different number makes
 * that lookup miss, leaks the registry entry, and every dialog opened afterwards escalates its mask's
 * z-index further above the panels until dropdowns render behind the very dialogs that host them.
 *
 * @param className - The CSS class name to target (e.g., 'location-autocomplete-overlay')
 * @param minimumZIndex - The floor the panel must not sit below (default: 10000)
 */
export function useOverlayZIndex(className: string, minimumZIndex: number = 10000): void {
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const panel = document.querySelector(`.${className}`);
            if (!(panel instanceof HTMLElement)) return;

            const raised = raisedOverlayZIndex(panel.style.zIndex, minimumZIndex);
            if (raised !== undefined) {
                panel.style.zIndex = raised;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });

        return () => observer.disconnect();
    }, [className, minimumZIndex]);
}

/**
 * Decides whether an overlay panel's inline z-index must be raised to the floor.
 *
 * Raise-only by design: a value PrimeReact computed at or above the floor is left untouched, both because
 * it is what stacks the panel above an open dialog and because PrimeReact reads it back to un-register the
 * overlay when it closes.
 *
 * @param currentZIndex - The panel's current inline z-index value, possibly empty.
 * @param minimumZIndex - The floor the panel must not sit below.
 * @returns The value to assign, or undefined when the current value must be left alone.
 */
export function raisedOverlayZIndex(currentZIndex: string, minimumZIndex: number): string | undefined {
    const current = Number.parseInt(currentZIndex, 10);
    if (Number.isNaN(current) || current < minimumZIndex) {
        return minimumZIndex.toString();
    }

    return undefined;
}
