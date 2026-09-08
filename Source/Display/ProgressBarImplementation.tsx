// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ProgressBarProps } from './ProgressBar';

/** Core implementation for the progress-bar presentation slot. */
export const ProgressBarImplementation = ({
    value = 0,
    mode = 'determinate',
    showValue = true,
    'aria-label': ariaLabel = 'Progress',
    'aria-labelledby': ariaLabelledBy,
    className,
}: ProgressBarProps) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const ariaValue = mode === 'determinate' ? boundedValue : undefined;
    const isBusy = mode === 'indeterminate' || boundedValue < 100;

    return (
        <div
            className={['cratis-progress-bar', className].filter(Boolean).join(' ')}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={isBusy || undefined}
            data-loading={mode === 'indeterminate' || undefined}
            role='progressbar'
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
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
