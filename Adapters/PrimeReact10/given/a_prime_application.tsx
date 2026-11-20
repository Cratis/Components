// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentType } from 'react';
import { PrimeReactProvider } from 'primereact/api/api.cjs.js';

/** Wraps a slot component in the application provider PrimeReact 10 components expect. */
export const withPrimeApplication = (Slot: ComponentType<Record<string, unknown>>): ComponentType<Record<string, unknown>> =>
    function PrimeApplication(props) {
        return (
            <PrimeReactProvider value={{ ripple: false }}>
                <Slot {...props} />
            </PrimeReactProvider>
        );
    };
