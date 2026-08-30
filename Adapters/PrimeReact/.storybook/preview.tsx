// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PrimeReactContext, defaultConfigProps } from '@primereact/core/config';
import { LocaleProvider } from '@primereact/core/locale';
import { PassThroughProvider } from '@primereact/core/passthrough';
import { ThemeProvider as PrimeThemeProvider } from '@primereact/core/theme';
import Aura from '@primeuix/themes/aura';
import type { ReactNode } from 'react';
import './preview.css';

export interface RendererEnvironmentProps {
    readonly appearance: string;
    readonly children: ReactNode;
}

// This bounded Storybook fixture deliberately uses PrimeReact 11's public contexts, matching the
// adapter conformance boundary. It does not mount PrimeReactProvider or invoke the real license
// manager. No credential or license value is accepted, read, stored, logged, serialized, bundled,
// or passed through Components; only the non-secret boolean setup attestation crosses that boundary.
const publicContextFixture = Object.freeze({ ...defaultConfigProps });

export const RendererEnvironment = ({ children }: RendererEnvironmentProps) => (
    <PrimeReactContext.Provider value={publicContextFixture}>
        <LocaleProvider lang='en'>
            <PassThroughProvider mergeSections mergeProps>
                <PrimeThemeProvider preset={Aura}>{children}</PrimeThemeProvider>
            </PassThroughProvider>
        </LocaleProvider>
    </PrimeReactContext.Provider>
);

export const rendererSetup = Object.freeze({
    'cratis-primereact.license-configured': true,
});
