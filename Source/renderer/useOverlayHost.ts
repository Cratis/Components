// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useContext, useMemo } from 'react';
import { TOOLTIP_OFFSET, zIndexAboveDialog } from './dialogStack';
import { OverlayHostContext } from './DialogStackContext';

/**
 * The overlay host an adapter-owned popup opened in. A popup bound to a host must close
 * immediately, without an exit transition, once the host closes, unmounts or changes identity.
 */
export interface unstable_OverlayHost {
    /** Unique per host instance. A different id means the popup now belongs to a different host. */
    readonly id: string;
    /** False once the host starts closing, while its children may still be mounted. */
    readonly open: boolean;
    /** The z-index, as a CSS expression, a tooltip popup uses to stay above the host. */
    readonly tooltipZIndex: string;
}

/** The host used outside any dialog: the document itself, which never closes. */
const documentHost: unstable_OverlayHost = Object.freeze({
    id: 'document',
    open: true,
    tooltipZIndex: 'var(--cratis-z-index-tooltip)',
});

/**
 * Reads the nearest overlay host: its identity, whether it is open and the stacking order a tooltip
 * must use to stay above it. Outside any host it reports the always-open document with the static
 * `--cratis-z-index-tooltip` token. Both z-index forms stay relative to the application's token
 * overrides.
 */
const useOverlayHost = (): unstable_OverlayHost => {
    const host = useContext(OverlayHostContext);
    return useMemo(
        () =>
            host === null
                ? documentHost
                : {
                      id: host.id,
                      open: host.open,
                      tooltipZIndex: zIndexAboveDialog(host.stackZIndex, TOOLTIP_OFFSET),
                  },
        [host],
    );
};

/** @unstable Adapter-author contract. Expect changes until renderer conformance gates promote it. */
export const unstable_useOverlayHost: () => unstable_OverlayHost = useOverlayHost;
