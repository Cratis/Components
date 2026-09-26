// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { StepperChangeEvent } from './CommandStepper';

type StepTransition = {
    index: number;
    currentStep: number;
    stepCount: number;
    isCurrentStepInvalid: boolean;
    linear: boolean;
    fromHeader?: boolean;
    visitedSteps: Set<number>;
    onActiveStepChange?: (index: number) => void;
    onVisitedStepsChange?: (visitedSteps: Set<number>) => void;
    onChangeStep?: (event: StepperChangeEvent) => void;
};

/** One navigation gate for both wizard footers and their step headers. */
export const transitionStep = ({
    index,
    currentStep,
    stepCount,
    isCurrentStepInvalid,
    linear,
    fromHeader = false,
    visitedSteps,
    onActiveStepChange,
    onVisitedStepsChange,
    onChangeStep,
}: StepTransition) => {
    if (
        index < 0 || index >= stepCount || index === currentStep ||
        (fromHeader && linear) || (index > currentStep && isCurrentStepInvalid) ||
        !onActiveStepChange
    ) {
        return;
    }

    if (index > currentStep) {
        onVisitedStepsChange?.(new Set(visitedSteps).add(currentStep));
    }
    onActiveStepChange(index);
    onChangeStep?.({ index });
};
