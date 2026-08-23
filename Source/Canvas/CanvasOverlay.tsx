// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface CanvasOverlayProps {
    children: ReactNode;
}

export const CanvasOverlay = ({ children }: CanvasOverlayProps) =>
    createPortal(children, document.body);
