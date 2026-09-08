// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CratisComponentsProvider } from '../../../Common/CratisComponentsProvider';
import { toast } from '../../toast';
import { Toaster, type ToasterProps } from '../../Toaster';

export interface ToasterInTheDom {
    container: HTMLDivElement;
    root: Root;
}

export const renderToaster = async (
    props: ToasterProps = {},
): Promise<ToasterInTheDom> => {
    // SAFETY: React's test-environment flag is an intentionally undocumented global absent from the DOM typings.
    (
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    toast.dismiss();
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
        root.render(
            <CratisComponentsProvider>
                <Toaster timeout={60_000} {...props} />
            </CratisComponentsProvider>,
        );
    });

    return { container, root };
};

export const unmountToaster = async (toaster: ToasterInTheDom) => {
    await act(async () => {
        toast.dismiss();
        toaster.root.unmount();
    });
    toaster.container.remove();
};
