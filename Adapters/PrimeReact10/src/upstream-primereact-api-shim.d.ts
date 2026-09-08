// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * @internal Compile-only boundary for the two PrimeReact 10 API imports used by this adapter.
 * PrimeReact 10.9.9's aggregate api.d.ts imports every component declaration and consequently
 * exposes unrelated React 19 onToggle conflicts. The packed adapter never emits this shim.
 */
declare module 'primereact/api' {
    import type { Context, FunctionComponent, ReactNode } from 'react';

    interface PrimeReact10ContextValue {
        readonly ripple?: boolean;
    }

    interface PrimeReact10ProviderProps {
        readonly children: ReactNode;
        readonly value?: Readonly<PrimeReact10ContextValue>;
    }

    export const PrimeReactContext: Context<PrimeReact10ContextValue | undefined>;
    export const PrimeReactProvider: FunctionComponent<PrimeReact10ProviderProps>;
}

declare module 'primereact/api/api.cjs.js' {
    export { PrimeReactContext, PrimeReactProvider } from 'primereact/api';
}
