// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ProgressBar as PrimeProgressBar } from 'primereact/progressbar/progressbar.cjs.js';
import type { ProgressBarProps } from '@cratis/components/Display';
import { classNames } from './shared.js';

const progressState = (value: number, mode: ProgressBarProps['mode']) => {
    const boundedValue = Math.min(100, Math.max(0, value));
    const determinate = mode === 'determinate';
    return { boundedValue, determinate, busy: !determinate || boundedValue < 100 };
};

const progressParts = (determinate: boolean) => ({
    root: determinate
        ? undefined
        : {
              'aria-valuemin': undefined,
              'aria-valuenow': undefined,
              'aria-valuemax': undefined,
          },
    value: { 'data-cratis-part': 'indicator' },
    label: {
        'data-cratis-part': 'label',
        'aria-hidden': true,
    },
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
        <PrimeProgressBar
            value={determinate ? boundedValue : null}
            mode={mode}
            showValue={showValue}
            className={classNames('cratis-primereact10-progress', className)}
            aria-label={ariaLabelledBy ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy}
            data-cratis-part='root'
            data-mode={mode}
            data-busy={busy || undefined}
            data-loading={!determinate || undefined}
            pt={progressParts(determinate)}
        />
    );
};
