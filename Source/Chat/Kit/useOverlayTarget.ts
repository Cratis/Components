// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useState } from 'react';
import { unstable_useOverlayEnvironment } from '../../renderer/RendererContext';

export function useOverlayTarget(open: boolean) {
    const environment = unstable_useOverlayEnvironment();
    const [container, setContainer] = useState<HTMLElement | null>(null);
    // Resolve only while open, including subsequent host renders after a deferred target appears.
    useLayoutEffect(() => { setContainer(open ? environment.getContainer() : null); });
    return container;
}
