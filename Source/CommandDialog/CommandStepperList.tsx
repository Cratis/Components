// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import type { StepperPanelProps } from './StepperPanel';
import { joinClassNames } from './joinClassNames';
import { StepNumber, StepSeparator, StepTitle, type StepPartProps, type StepperPt } from './CommandStepperStepParts';

interface CommandStepperListProps {
    panels: React.ReactElement<StepperPanelProps>[];
    currentStep: number;
    visitedSteps: Set<number>;
    stepErrors: boolean[];
    linear: boolean;
    stepperId: string;
    isBusy: boolean;
    hasAnyStepErrors: boolean;
    pt: StepperPt;
    onHeaderClick: (index: number) => void;
}

interface StepProps extends StepPartProps {
    panel: React.ReactElement<StepperPanelProps>;
    index: number;
    isLast: boolean;
    headerDisabled: boolean;
    stepperId: string;
    onHeaderClick: (index: number) => void;
}

const headerIdOf = (pt: StepperPt, stepperId: string, index: number) =>
    pt?.header?.id ?? `${stepperId}-step-${index}`;

const StepHeader = ({ panel, index, headerDisabled, stepperId, onHeaderClick, ...part }: Omit<StepProps, 'isLast'>) => {
    const { pt, selected, visited, invalid, isBusy } = part;
    return (
        <button
            {...pt?.header}
            type='button'
            id={headerIdOf(pt, stepperId, index)}
            className={joinClassNames('cratis-command-stepper__header', pt?.header?.className)}
            data-cratis-part='header'
            data-part='header'
            data-busy={isBusy || undefined}
            data-disabled={headerDisabled || undefined}
            data-invalid={invalid || undefined}
            data-selected={selected || undefined}
            data-visited={visited || undefined}
            disabled={headerDisabled}
            aria-current={selected ? 'step' : undefined}
            onClick={() => onHeaderClick(index)}
        >
            <StepNumber {...part} index={index} />
            <StepTitle {...part} header={panel.props.header} />
        </button>
    );
};

const CommandStepperStep = ({ isLast, ...header }: StepProps) => {
    const { pt, selected, visited, invalid, isBusy } = header;
    return (
        <li
            {...pt?.step}
            className={joinClassNames('cratis-command-stepper__step', pt?.step?.className)}
            data-cratis-part='step'
            data-part='step'
            data-active={selected || undefined}
            data-selected={selected || undefined}
            data-visited={visited || undefined}
            data-invalid={invalid || undefined}
            data-busy={isBusy || undefined}
        >
            <StepHeader {...header} />
            <StepSeparator pt={pt} selected={selected} visited={visited} invalid={invalid} isBusy={isBusy} isLast={isLast} />
        </li>
    );
};

/** The step header list of the stepper. */
export const CommandStepperList = ({
    panels,
    currentStep,
    visitedSteps,
    stepErrors,
    linear,
    stepperId,
    isBusy,
    hasAnyStepErrors,
    pt,
    onHeaderClick,
}: CommandStepperListProps) => (
    <ol
        {...pt?.list}
        className={joinClassNames('cratis-command-stepper__list', pt?.list?.className)}
        data-cratis-part='list'
        data-part='list'
        data-busy={isBusy || undefined}
        data-invalid={hasAnyStepErrors || undefined}
    >
        {panels.map((panel, index) => {
            const selected = index === currentStep;
            return (
                <CommandStepperStep
                    key={index}
                    panel={panel}
                    index={index}
                    isLast={index >= panels.length - 1}
                    selected={selected}
                    visited={visitedSteps.has(index)}
                    invalid={stepErrors[index] ?? false}
                    headerDisabled={linear && !selected}
                    stepperId={stepperId}
                    isBusy={isBusy}
                    pt={pt}
                    onHeaderClick={onHeaderClick}
                />
            );
        })}
    </ol>
);
