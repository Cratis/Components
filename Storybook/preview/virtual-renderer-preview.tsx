// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';

export interface RendererPreviewProviderProps {
    readonly appearance: string;
    readonly children: ReactNode;
}

/** Type-checking placeholder replaced by the selected renderer's Vite virtual module. */
export const RendererPreviewProvider = ({ children }: RendererPreviewProviderProps) => children;
export const rendererId = 'typecheck-placeholder';
