// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act, type ComponentType, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import type { CratisDialogSlotProps } from '../../../Dialogs/DialogHost';
import { definePresentationUiLibrary } from '../..';
import { aStablePresentationLibrary, dialogAtomicSlots } from './a_stable_presentation_library';

/** A mounted React root rendering dialogs through a stable library's adapter dialog. */
export interface AnAtomicDialogInTheDom {
    readonly container: HTMLDivElement;
    render(children: ReactNode): Promise<void>;
    unmount(): void;
}

/**
 * Mounts a React root whose stable library renders `dialogs.dialog` with the given adapter.
 * @param adapter The adapter dialog component.
 * @returns The mounted root.
 */
export const anAtomicDialogInTheDom = (adapter: ComponentType<CratisDialogSlotProps>): AnAtomicDialogInTheDom => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    const library = definePresentationUiLibrary(aStablePresentationLibrary(dialogAtomicSlots(adapter)));
    const container = document.createElement('div');
    document.body.append(container);
    const root: Root = createRoot(container);
    return {
        container,
        render: (children) =>
            act(() => {
                root.render(<CratisComponentsProvider library={library}>{children}</CratisComponentsProvider>);
            }),
        unmount: () => {
            act(() => root.unmount());
            container.remove();
        },
    };
};

/** Waits for the animation frame in which a dialog moves its initial focus. */
export const nextFrame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
