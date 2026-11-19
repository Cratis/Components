// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import { PrimeReactContext, defaultConfigProps } from '@primereact/core/config';
import { LocaleProvider } from '@primereact/core/locale';
import { PassThroughProvider } from '@primereact/core/passthrough';
import { ThemeProvider as PrimeThemeProvider } from '@primereact/core/theme';
import Aura from '@primeuix/themes/aura';

// SAFETY: Presentation fixtures need only the documented configuration values; the public context
// avoids invoking the real license manager with a fake credential.
const fixtureConfig = Object.freeze({ ...defaultConfigProps });

/** Wraps a slot component in the application providers PrimeReact components require. */
export const withPrimeApplication = (Slot: ComponentType<Record<string, unknown>>): ComponentType<Record<string, unknown>> =>
    function PrimeApplication(props) {
        return (
            <PrimeReactContext.Provider value={fixtureConfig}>
                <LocaleProvider lang='en'>
                    <PassThroughProvider mergeSections mergeProps>
                        <PrimeThemeProvider preset={Aura}>
                            <Slot {...props} />
                        </PrimeThemeProvider>
                    </PassThroughProvider>
                </LocaleProvider>
            </PrimeReactContext.Provider>
        );
    };
