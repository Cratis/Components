// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useMemo, type ReactNode } from 'react';

export interface RendererEnvironmentProps {
    readonly appearance: string;
    readonly children: ReactNode;
}

/** Storybook-only Material UI theme boundary for this isolated renderer preview. */
export const RendererEnvironment = ({
    appearance,
    children,
}: RendererEnvironmentProps) => {
    const dark = appearance !== 'baseline-light';
    const theme = useMemo(
        () =>
            createTheme({
                cssVariables: true,
                palette: {
                    mode: dark ? 'dark' : 'light',
                    primary: { main: dark ? '#90caf9' : '#005ea8' },
                    warning: {
                        main: dark ? '#ffb74d' : '#8a3b00',
                        contrastText: dark ? '#111827' : '#ffffff',
                    },
                    error: {
                        main: dark ? '#ef9a9a' : '#c62828',
                        contrastText: dark ? '#111827' : '#ffffff',
                    },
                },
            }),
        [dark],
    );
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export const rendererSetup = Object.freeze({});
