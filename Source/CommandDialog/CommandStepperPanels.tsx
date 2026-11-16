// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import type { StepperCustomizationProps } from './CommandStepper';
import type { StepperPanelProps } from './StepperPanel';
import { processChildren } from './commandStepperFields';
import { joinClassNames } from './joinClassNames';

type StepperPt = StepperCustomizationProps['pt'];

interface CommandStepperPanelsProps {
    panels: React.ReactElement<StepperPanelProps>[];
    currentStep: number;
    visitedSteps: Set<number>;
    stepErrors: boolean[];
    stepperId: string;
    isBusy: boolean;
    hasAnyStepErrors: boolean;
    disableFieldsWhileSubmitting: boolean;
    isSubmitting: boolean;
    pt: StepperPt;
}

interface PanelBodyProps {
    children: React.ReactNode;
    locked: boolean;
    isSubmitting: boolean;
}

const PanelBody = ({ children, locked, isSubmitting }: PanelBodyProps) => locked ? (
    <fieldset disabled={isSubmitting} inert={isSubmitting} style={{ display: 'contents' }}>
        {processChildren(children)}
    </fieldset>
) : <>{processChildren(children)}</>;

/** The step panels of the stepper — only the current one is not hidden. */
export const CommandStepperPanels = ({
    panels,
    currentStep,
    visitedSteps,
    stepErrors,
    stepperId,
    isBusy,
    hasAnyStepErrors,
    disableFieldsWhileSubmitting,
    isSubmitting,
    pt,
}: CommandStepperPanelsProps) => (
    <div
        {...pt?.panels}
        className={joinClassNames('cratis-command-stepper__panels', pt?.panels?.className)}
        data-cratis-part='panels'
        data-part='panels'
        data-busy={isBusy || undefined}
        data-invalid={hasAnyStepErrors || undefined}
    >
        {panels.map((panel, index) => (
            <section
                key={index}
                {...pt?.panel}
                hidden={index !== currentStep}
                className={joinClassNames('cratis-command-stepper__panel', pt?.panel?.className)}
                data-cratis-part='panel'
                data-part='panel'
                data-busy={isBusy || undefined}
                data-invalid={stepErrors[index] || undefined}
                data-selected={index === currentStep || undefined}
                data-visited={visitedSteps.has(index) || undefined}
                aria-label={String(panel.props.header ?? `Step ${index + 1}`)}
                aria-labelledby={pt?.panel?.['aria-labelledby'] ?? (pt?.header?.id == null ? `${stepperId}-step-${index}` : undefined)}
            >
                <PanelBody locked={disableFieldsWhileSubmitting} isSubmitting={isSubmitting}>
                    {panel.props.children}
                </PanelBody>
            </section>
        ))}
    </div>
);
