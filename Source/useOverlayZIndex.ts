// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';

/**
 * Hook to force a specific z-index on PrimeReact overlay components.
 * This is a workaround for PrimeReact's automatic z-index calculation
 * which can cause overlays to appear behind dialogs.
 *
 * @param className - The CSS class name to target (e.g., 'location-autocomplete-overlay')
 * @param zIndex - The desired z-index value (default: 10000)
 */
export function useOverlayZIndex(className: string, zIndex: number = 10000): void {
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const panel = document.querySelector(`.${className}`);
            if (panel instanceof HTMLElement && panel.style.zIndex !== zIndex.toString()) {
                panel.style.zIndex = zIndex.toString();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });

        return () => observer.disconnect();
    }, [className, zIndex]);
}
