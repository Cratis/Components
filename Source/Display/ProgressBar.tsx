// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

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

/** A horizontal determinate or indeterminate progress indicator. */
export const ProgressBar = ({
    value = 0,
    mode = 'determinate',
    showValue = true,
    className,
}: ProgressBarProps) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const ariaValue = mode === 'determinate' ? boundedValue : undefined;

    return (
        <div
            className={['cratis-progress-bar', className].filter(Boolean).join(' ')}
            data-cratis-part='root'
            data-mode={mode}
            role='progressbar'
            aria-valuemin={mode === 'determinate' ? 0 : undefined}
            aria-valuemax={mode === 'determinate' ? 100 : undefined}
            aria-valuenow={ariaValue}
        >
            <span
                className='cratis-progress-bar__indicator'
                data-cratis-part='indicator'
                style={mode === 'determinate' ? { width: `${boundedValue}%` } : undefined}
            >
                {showValue && mode === 'determinate' && (
                    <span className='cratis-progress-bar__label' data-cratis-part='label'>
                        {boundedValue}%
                    </span>
                )}
            </span>
        </div>
    );
};
