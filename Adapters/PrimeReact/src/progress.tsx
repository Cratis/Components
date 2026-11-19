// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ProgressBar as PrimeProgressBar } from '@primereact/ui/progressbar';
import type { ProgressBarProps } from '@cratis/components/Display';
import { classNames } from './shared.js';

const progressState = (value: number, mode: ProgressBarProps['mode']) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const determinate = mode === 'determinate';
    return { boundedValue, determinate, busy: !determinate || boundedValue < 100 };
};

const progressAria = (
    determinate: boolean,
    ariaLabel: string,
    ariaLabelledBy: string | undefined,
) => ({
    'aria-label': ariaLabelledBy ? undefined : ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...(determinate
        ? {}
        : {
              'aria-valuemin': undefined,
              'aria-valuenow': undefined,
              'aria-valuemax': undefined,
          }),
});

export const PrimeProgressSlot = ({
    value = 0,
    mode = 'determinate',
    showValue = true,
    'aria-label': ariaLabel = 'Progress',
    'aria-labelledby': ariaLabelledBy,
    className,
}: ProgressBarProps) => {
    const { boundedValue, determinate, busy } = progressState(value, mode);
    return (
        <div
            className={classNames('cratis-primereact-progress', className)}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
        >
            <PrimeProgressBar.Root
                as='div'
                value={determinate ? boundedValue : undefined}
                mode={mode}
                pt={{ root: progressAria(determinate, ariaLabel, ariaLabelledBy) }}
            >
                <PrimeProgressBar.Track data-cratis-part='indicator'>
                    <PrimeProgressBar.Indicator />
                </PrimeProgressBar.Track>
                {determinate && showValue ? (
                    <PrimeProgressBar.Label data-cratis-part='label'>
                        {boundedValue}%
                    </PrimeProgressBar.Label>
                ) : null}
            </PrimeProgressBar.Root>
        </div>
    );
};
