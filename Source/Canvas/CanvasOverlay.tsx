// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Props for a Canvas overlay portaled to the browser document body. */
export interface CanvasOverlayProps {
    /** Overlay content; omitted during SSR and the first hydration render. */
    children: ReactNode;
}

const subscribeToBrowserEnvironment = () => () => undefined;
const useIsBrowser = () =>
    useSyncExternalStore(
        subscribeToBrowserEnvironment,
        () => true,
        () => false,
    );

/** A body-level overlay that stays empty during SSR and the first hydration render. */
export const CanvasOverlay = ({ children }: CanvasOverlayProps) => {
    const isBrowser = useIsBrowser();
    return isBrowser ? createPortal(children, document.body) : null;
};
