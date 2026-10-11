// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

/** The anchor element and the Cratis Dialog (if any) that contains it. */
export interface ResolvedAnchor {
    anchor: HTMLButtonElement | null;
    modalRoot: HTMLElement | null;
}

/**
 * Resolves the anchor element and its enclosing modal after commit.
 *
 * Refs attach during commit, after render. Resolving the modal before mounting any open
 * panel keeps its first portal from landing in a shared root hidden by the modal.
 *
 * @param anchorRef - The anchor button's ref.
 * @returns The resolved anchor, or null before the first commit.
 */
export function useResolvedAnchor(anchorRef: RefObject<HTMLButtonElement | null>): ResolvedAnchor | null {
    const [resolvedAnchor, setResolvedAnchor] = useState<ResolvedAnchor | null>(null);
    // Ref attachment/identity can change on any commit; the state updater bails out if unchanged.
    // eslint-disable-next-line @eslint-react/exhaustive-deps
    useLayoutEffect(() => {
        const anchor = anchorRef.current;
        const modalRoot = anchor?.closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]') ?? null;
        setResolvedAnchor((previous) => previous?.anchor === anchor && previous.modalRoot === modalRoot
            ? previous
            : { anchor, modalRoot });
    });
    return resolvedAnchor;
}
