// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useSyncExternalStore } from 'react';
import type { RefObject } from 'react';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import { useResolvedAnchor } from './useResolvedAnchor';

const subscribeToBrowserState = () => () => undefined;
const browserSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * A shared overlay root sits outside a modal's focus scope and is hidden from assistive
 * technology. Keep a panel anchored inside a Cratis Dialog inside that modal instead.
 * An explicitly unavailable container still defers the portal; it is never a body fallback.
 */
function resolvePortalContainer(
    environmentContainer: HTMLElement | null,
    modalRoot: HTMLElement | null | undefined,
): HTMLElement | null {
    return environmentContainer && modalRoot && !modalRoot.contains(environmentContainer)
        ? modalRoot
        : environmentContainer;
}

/**
 * Resolves where a panel portals to and which anchor it is attached to, deferring
 * until the browser, the overlay environment and the anchor are all available.
 * @param anchorRef - The anchor the panel is positioned against.
 * @returns The resolved anchor, its modal root and the portal container.
 */
export const usePortalTarget = (anchorRef: RefObject<HTMLButtonElement | null>) => {
    const isBrowser = useSyncExternalStore(subscribeToBrowserState, browserSnapshot, serverSnapshot);
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const environmentContainer = isBrowser ? overlayEnvironment.getContainer() : null;
    const resolvedAnchor = useResolvedAnchor(anchorRef);
    const modalRoot = resolvedAnchor?.modalRoot;
    const portalContainer = resolvePortalContainer(environmentContainer, modalRoot);
    return { resolvedAnchor, modalRoot, portalContainer };
};
