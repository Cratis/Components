// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ProgressBar as PrimeProgressBar } from 'primereact/progressbar';

/** Props for {@link ProgressBar}. */
export interface ProgressBarProps {
    /** Completion value, 0–100. Ignored in `indeterminate` mode. */
    value?: number;
    /** `determinate` (default) shows {@link value}; `indeterminate` shows a looping animation. */
    mode?: 'determinate' | 'indeterminate';
    /** Whether to render the percentage label. Defaults to `true` (determinate only). */
    showValue?: boolean;
    /** Extra class name. */
    className?: string;
}

/**
 * A horizontal progress indicator built on PrimeReact 11's compositional
 * `ProgressBar`. Use `indeterminate` for unknown-duration work and
 * `determinate` with a `value` for measurable progress (e.g. an upload).
 */
export const ProgressBar = ({ value, mode = 'determinate', showValue = true, className }: ProgressBarProps) => (
    <PrimeProgressBar.Root value={value} mode={mode} className={className}>
        <PrimeProgressBar.Indicator>
            {showValue && mode === 'determinate' && (
                <PrimeProgressBar.Label>{value ?? 0}%</PrimeProgressBar.Label>
            )}
        </PrimeProgressBar.Indicator>
    </PrimeProgressBar.Root>
);
