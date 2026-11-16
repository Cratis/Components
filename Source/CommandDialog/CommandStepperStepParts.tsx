// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import type { StepperCustomizationProps } from './CommandStepper';
import { joinClassNames } from './joinClassNames';

export type StepperPt = StepperCustomizationProps['pt'];

export interface StepPartProps {
    pt: StepperPt;
    selected: boolean;
    visited: boolean;
    invalid: boolean;
    isBusy: boolean;
}

/** The numbered marker of a step. */
export const StepNumber = ({ pt, selected, visited, invalid, isBusy, index }: StepPartProps & { index: number }) => (
    <span
        {...pt?.number}
        className={joinClassNames('cratis-command-stepper__number', pt?.number?.className)}
        data-cratis-part='number'
        data-part='number'
        data-busy={isBusy || undefined}
        data-invalid={invalid || undefined}
        data-selected={selected || undefined}
        data-visited={visited || undefined}
    >
        {index + 1}
    </span>
);

/** The title of a step. */
export const StepTitle = ({ pt, selected, visited, invalid, isBusy, header }: StepPartProps & { header: React.ReactNode }) => (
    <span
        {...pt?.title}
        className={joinClassNames('cratis-command-stepper__title', pt?.title?.className)}
        data-cratis-part='title'
        data-part='title'
        data-busy={isBusy || undefined}
        data-invalid={invalid || undefined}
        data-selected={selected || undefined}
        data-visited={visited || undefined}
    >
        {header}
    </span>
);

/** The connector after a step; absent after the last one. */
export const StepSeparator = ({ pt, visited, invalid, isBusy, isLast }: StepPartProps & { isLast: boolean }) => isLast ? null : (
    <span
        {...pt?.separator}
        className={joinClassNames('cratis-command-stepper__separator', pt?.separator?.className)}
        data-cratis-part='separator'
        data-part='separator'
        data-busy={isBusy || undefined}
        data-invalid={invalid || undefined}
        data-visited={visited || undefined}
        aria-hidden='true'
    />
);
