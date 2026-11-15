// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { CratisComponentsProvider } from '../../../../Common/CratisComponentsProvider';
import { DialogStackContext } from '../../../../renderer/DialogStackContext';
import type { CratisOverlayEnvironment } from '../../../../renderer/overlayEnvironment';
import { AnchoredOverlay } from '../../AnchoredOverlay';
export { click, press, render, unmount } from '../../for_ChatComposer/given/a_composer_in_the_dom';

export const Overlay = ({ open = true, environment, layer = null, anchorStyle, children = <span data-picker>Picker</span> }: {
    open?: boolean;
    anchorStyle?: CSSProperties;
    environment?: CratisOverlayEnvironment;
    layer?: string | null;
    children?: ReactNode;
}) => {
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
        <CratisComponentsProvider overlayEnvironment={environment}>
            <DialogStackContext.Provider value={layer}>
                <button ref={anchorRef} style={anchorStyle}>Anchor</button>
                <AnchoredOverlay anchorRef={anchorRef} open={open}>{children}</AnchoredOverlay>
            </DialogStackContext.Provider>
        </CratisComponentsProvider>
    );
};
