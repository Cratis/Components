// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { renderToStaticMarkup } from 'react-dom/server';
import { CanvasControls, type CanvasControlsProps } from '../CanvasControls';

export const renderControls = (props: Partial<CanvasControlsProps> = {}) =>
    renderToStaticMarkup(
        <CanvasControls
            getZoom={() => 1}
            onZoomIn={() => undefined}
            onZoomOut={() => undefined}
            onZoomReset={() => undefined}
            {...props}
        />,
    );
