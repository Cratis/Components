// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import MuiLinearProgress from '@mui/material/LinearProgress';
import type { ProgressBarProps } from '@cratis/components/Display';
import { classNames } from './shared.js';

export const MuiProgressSlot = ({
    value = 0,
    mode = 'determinate',
    showValue = true,
    'aria-label': ariaLabel = 'Progress',
    'aria-labelledby': ariaLabelledBy,
    className,
}: ProgressBarProps) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const determinate = mode === 'determinate';
    const busy = !determinate || boundedValue < 100;
    return (
        <div
            role='progressbar'
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuemin={determinate ? 0 : undefined}
            aria-valuemax={determinate ? 100 : undefined}
            aria-valuenow={determinate ? boundedValue : undefined}
            className={classNames('cratis-mui-progress', className)}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
        >
            <MuiLinearProgress
                variant={determinate ? 'determinate' : 'indeterminate'}
                value={determinate ? boundedValue : undefined}
                role='presentation'
                aria-hidden='true'
                data-cratis-part='indicator'
            />
            {determinate && showValue && (
                <span data-cratis-part='label'>{boundedValue}%</span>
            )}
        </div>
    );
};
