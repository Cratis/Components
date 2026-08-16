// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { ProgressSpinner as PrimeProgressSpinner } from 'primereact/progressspinner';

/** Props for {@link ProgressSpinner}. */
export interface ProgressSpinnerProps {
    /** Applied to the spinner root — use it to size the spinner. */
    style?: React.CSSProperties;
    /** Extra class name applied to the spinner root. */
    className?: string;
    /** Announced to assistive technology while the spinner is visible. */
    'aria-label'?: string;
}

/**
 * An indeterminate spinner built on PrimeReact 11's compositional `ProgressSpinner` parts.
 *
 * PrimeReact 10's single `<ProgressSpinner />` became `ProgressSpinner.Root` + `Track` +
 * `Range` in 11; this preserves the flat call shape for the common loading indicator.
 */
export const ProgressSpinner = ({ style, className, 'aria-label': ariaLabel = 'Loading' }: ProgressSpinnerProps) => (
    <PrimeProgressSpinner.Root style={style} className={className} aria-label={ariaLabel}>
        <PrimeProgressSpinner.Track />
        <PrimeProgressSpinner.Range />
    </PrimeProgressSpinner.Root>
);
