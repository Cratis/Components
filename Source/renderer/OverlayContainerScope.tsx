// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { use, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { CratisOverlayEnvironment } from './overlayEnvironment';
import {
    unstable_RendererContext as RendererContext,
    unstable_useOverlayEnvironment,
} from './RendererContext';

/** One overlay container: the element it registered and the registration callback it hands out. */
export interface OverlayContainer {
    /** Overlay environment its descendants portal through. */
    readonly environment: CratisOverlayEnvironment;
    /**
     * Registers the element descendant overlays portal into, or clears it with `null`. The callback
     * is bound to one open session of one host: once the host closes it is replaced, so a stale
     * callback can never re-register an element on a host that has since reopened.
     */
    readonly register: (element: HTMLElement | null) => void;
}

interface Session {
    readonly id: number;
    readonly element: HTMLElement | null;
}

const closedSession: Session = Object.freeze({ id: -1, element: null });

/**
 * Creates the overlay container for one atomic overlay, such as an adapter dialog rendered in the
 * browser top layer. While the host is open and an element is registered, its descendants portal
 * into that element, so they stay visible and interactive above the host; before registration they
 * keep the surrounding environment. While the host is closed its descendants get no container, so
 * an overlay left open inside it never escapes into the surrounding page. The registration lives in
 * this hook only: it is dropped when the host closes or unmounts and never leaks to another host.
 * @param open Whether the host is currently open.
 * @returns The host's overlay environment and registration callback.
 */
export const useOverlayContainer = (open: boolean): OverlayContainer => {
    const parent = unstable_useOverlayEnvironment();
    const [sessionCount, setSessionCount] = useState(0);
    const [openedFor, setOpenedFor] = useState(open);
    const [session, setSession] = useState<Session>(closedSession);

    // A host that opens again starts a new session; closing drops the registered element.
    if (open !== openedFor) {
        setOpenedFor(open);
        if (open) setSessionCount((count) => count + 1);
        setSession(closedSession);
    }

    const register = useCallback(
        (element: HTMLElement | null) =>
            setSession((current) => {
                if (!open) return closedSession;
                if (element === null) return current.id === sessionCount ? closedSession : current;
                return { id: sessionCount, element };
            }),
        [open, sessionCount],
    );

    const element = open && session.id === sessionCount ? session.element : null;
    const environment = useMemo<CratisOverlayEnvironment>(
        () =>
            Object.freeze({
                getContainer: () => {
                    if (!open) return null;
                    return element?.isConnected ? element : parent.getContainer();
                },
            }),
        [element, open, parent],
    );

    return useMemo(() => ({ environment, register }), [environment, register]);
};

/** Props for {@link OverlayContainerScope}. */
export interface OverlayContainerScopeProps {
    /** The overlay container whose environment the children portal through. */
    readonly host: OverlayContainer;
    readonly children: ReactNode;
}

/**
 * Provides an overlay container's environment to its descendants, keeping every other renderer setting
 * of the surrounding provider. Without a surrounding renderer the children render unchanged.
 */
export const OverlayContainerScope = ({ host, children }: OverlayContainerScopeProps) => {
    const parent = use(RendererContext);
    const value = useMemo(
        () => (parent ? Object.freeze({ ...parent, overlayEnvironment: host.environment }) : undefined),
        [host.environment, parent],
    );
    if (!value) return children;
    return <RendererContext value={value}>{children}</RendererContext>;
};
