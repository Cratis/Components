// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import '@digdir/designsystemet-css';
import '@digdir/designsystemet-css/theme.css';
import { useLayoutEffect, type ReactNode } from 'react';

export interface RendererEnvironmentProps {
    readonly appearance: string;
    readonly children: ReactNode;
}

/**
 * Storybook-only Designsystemet environment: the real Designsystemet stylesheet and default theme
 * are imported above, and the color scheme is driven by `data-color-scheme` on the document element
 * with the Designsystemet page colors, so axe contrast checks see what an application would paint.
 */
export const RendererEnvironment = ({
    appearance,
    children,
}: RendererEnvironmentProps) => {
    const colorScheme = appearance === 'baseline-light' ? 'light' : 'dark';
    useLayoutEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        root.setAttribute('data-color-scheme', colorScheme);
        body.style.backgroundColor = 'var(--ds-color-neutral-background-default)';
        body.style.color = 'var(--ds-color-neutral-text-default)';
        return () => {
            root.removeAttribute('data-color-scheme');
            body.style.removeProperty('background-color');
            body.style.removeProperty('color');
        };
    }, [colorScheme]);
    return <>{children}</>;
};

export const rendererSetup = Object.freeze({});
