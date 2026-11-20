// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import MuiLinearProgress from '@mui/material/LinearProgress';
import type { ProgressBarProps } from '@cratis/components/Display';
import { classNames } from './shared.js';

interface ProgressState {
    readonly mode: NonNullable<ProgressBarProps['mode']>;
    readonly boundedValue: number;
    readonly determinate: boolean;
    readonly busy: boolean;
}

const progressState = ({ value = 0, mode = 'determinate' }: ProgressBarProps): ProgressState => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const determinate = mode === 'determinate';
    return { mode, boundedValue, determinate, busy: !determinate || boundedValue < 100 };
};

const progressAria = (
    { determinate, boundedValue }: ProgressState,
    ariaLabel: string,
    ariaLabelledBy: string | undefined,
) => ({
    'aria-label': ariaLabelledBy ? undefined : ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-valuemin': determinate ? 0 : undefined,
    'aria-valuemax': determinate ? 100 : undefined,
    'aria-valuenow': determinate ? boundedValue : undefined,
});

const progressIndicator = ({ determinate, boundedValue }: ProgressState) => (
    <MuiLinearProgress
        variant={determinate ? 'determinate' : 'indeterminate'}
        value={determinate ? boundedValue : undefined}
        role='presentation'
        aria-hidden='true'
        data-cratis-part='indicator'
    />
);

export const MuiProgressSlot = ({
    showValue = true,
    'aria-label': ariaLabel = 'Progress',
    'aria-labelledby': ariaLabelledBy,
    className,
    ...progress
}: ProgressBarProps) => {
    const state = progressState(progress);
    return (
        <div
            role='progressbar'
            {...progressAria(state, ariaLabel, ariaLabelledBy)}
            className={classNames('cratis-mui-progress', className)}
            data-cratis-part='root'
            data-mode={state.mode}
            data-busy={state.busy || undefined}
            data-loading={!state.determinate || undefined}
        >
            {progressIndicator(state)}
            {state.determinate && showValue && (
                <span data-cratis-part='label'>{state.boundedValue}%</span>
            )}
        </div>
    );
};
