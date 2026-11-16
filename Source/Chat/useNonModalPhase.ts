// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';

/** The lifecycle phase of a non-modal sidebar's enter and exit animation. */
export type NonModalPhase = 'closed' | 'entering' | 'open' | 'exiting';

const settledPhase = (phase: NonModalPhase): NonModalPhase => (phase === 'entering' ? 'open' : 'closed');

const hasNoAnimation = (panel: HTMLDivElement | null): boolean =>
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) ||
    panel?.getAnimations?.().length === 0;

const followOpen = (open: boolean) => (phase: NonModalPhase): NonModalPhase => {
    if (open) return 'entering';
    return phase === 'closed' ? 'closed' : 'exiting';
};

/**
 * Tracks the enter/exit animation phase of a non-modal sidebar and the portal container it
 * renders into, settling the phase when the animation ends, is skipped or times out.
 * @param open Whether the sidebar is open.
 * @param modal Whether the sidebar is modal, in which case no portal container is used.
 * @returns The phase, its setter, the panel ref to observe animations on and the portal container.
 */
export const useNonModalPhase = (open: boolean, modal: boolean) => {
    const overlayEnvironment = unstable_useOverlayEnvironment();
    const [mounted, setMounted] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const [phase, setPhase] = useState<NonModalPhase>('closed');

    useEffect(() => setMounted(true), []);
    useEffect(() => {
        setPhase(followOpen(open));
    }, [open]);

    const portalContainer = !modal && mounted && phase !== 'closed' ? overlayEnvironment.getContainer() : null;

    useEffect(() => {
        if (phase !== 'entering' && phase !== 'exiting') return;
        if (!modal && hasNoAnimation(panelRef.current)) {
            setPhase(settledPhase(phase));
            return;
        }
        const timeout = setTimeout(() => {
            setPhase(settledPhase(phase));
        }, 250);
        return () => clearTimeout(timeout);
    }, [modal, phase, portalContainer]);

    return { phase, setPhase, panelRef, portalContainer };
};
