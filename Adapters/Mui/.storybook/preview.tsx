// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useMemo, type ReactNode } from 'react';

export interface RendererEnvironmentProps {
    readonly appearance: string;
    readonly children: ReactNode;
}

/** Storybook-only Material UI theme boundary for this isolated renderer preview. */
export const RendererEnvironment = ({ appearance, children }: RendererEnvironmentProps) => {
    const dark = appearance !== 'baseline-light';
    const theme = useMemo(
        () => createTheme({ cssVariables: true, palette: { mode: dark ? 'dark' : 'light' } }),
        [dark],
    );
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export const rendererSetup = Object.freeze({});
