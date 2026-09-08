// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/lara-dark-blue/theme.css';
import type { ReactNode } from 'react';
import './preview.css';

export interface RendererEnvironmentProps {
    readonly appearance: string;
    readonly children: ReactNode;
}

/** Storybook-only PrimeReact 10.9.9 provider and v10 Lara theme boundary. */
export const RendererEnvironment = ({
    appearance,
    children,
}: RendererEnvironmentProps) => (
    <PrimeReactProvider value={{ ripple: false }}>
        <div
            className={
                appearance === 'baseline-light' ? 'cratis-prime10-light' : undefined
            }
        >
            {children}
        </div>
    </PrimeReactProvider>
);

export const rendererSetup = Object.freeze({});
