// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useMemo } from 'react';
import type { StepperPanelProps } from './StepperPanel';
import { getStepPanels } from './stepChildren';
import { transitionStep } from './transitionStep';
import type { StepperChangeEvent } from './CommandStepper';
import { useStepValidation } from './useStepValidation';

interface StepperStateInput {
    children: React.ReactNode;
    activeStep: number;
    visitedSteps: Set<number>;
    linear: boolean;
    getFieldError?: (fieldName: string) => unknown;
    onStepErrorsChange?: (stepErrors: boolean[]) => void;
    onActiveStepChange?: (stepIndex: number) => void;
    onVisitedStepsChange?: (visitedSteps: Set<number>) => void;
    onChangeStep?: (event: StepperChangeEvent) => void;
}

/**
 * Derives the rendered steps, the clamped current step, the validation state and the
 * navigation gate of a stepper from its controlled props.
 */
export const useStepperState = ({
    children,
    activeStep,
    visitedSteps,
    linear,
    getFieldError,
    onStepErrorsChange,
    onActiveStepChange,
    onVisitedStepsChange,
    onChangeStep,
}: StepperStateInput) => {
    // The steps that actually render. Conditional steps (`{condition && <StepperPanel/>}`)
    // leave falsy children behind, so the count, the per-step validation state and what the
    // Stepper renders are all derived from this one list — they cannot drift apart.
    const panels = useMemo(
        () => getStepPanels(children) as React.ReactElement<StepperPanelProps>[],
        [children],
    );
    const stepCount = panels.length;

    // A conditional step can vanish after the user has advanced past it, which leaves the
    // incoming index pointing at a step that is no longer rendered. Clamp it into the set that
    // is, so the panel shown, the validation state read and the buttons offered all belong to a
    // step that exists.
    const currentStep = Math.min(Math.max(activeStep, 0), Math.max(stepCount - 1, 0));

    const stepErrors = useStepValidation(panels, getFieldError, onStepErrorsChange);
    const isCurrentStepInvalid = stepErrors[currentStep] ?? false;

    const changeStep = (index: number, fromHeader = false) => transitionStep({
        index,
        currentStep,
        stepCount,
        isCurrentStepInvalid,
        linear,
        fromHeader,
        visitedSteps,
        onActiveStepChange,
        onVisitedStepsChange,
        onChangeStep,
    });

    return {
        panels,
        currentStep,
        isFirstStep: currentStep <= 0,
        isLastStep: currentStep >= stepCount - 1,
        stepErrors,
        isCurrentStepInvalid,
        hasAnyStepErrors: stepErrors.some((hasError) => hasError),
        changeStep,
    };
};
