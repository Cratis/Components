// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useId } from 'react';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import type { StepperCustomizationProps } from './CommandStepper';
import { CommandStepperList } from './CommandStepperList';
import { CommandStepperPanels } from './CommandStepperPanels';
import { CommandStepperNavigation } from './CommandStepperNavigation';
import { resolveStepperLabels } from './resolveStepperLabels';
import { useStepperState } from './useStepperState';
import { joinClassNames } from './joinClassNames';

/**
 * Controlled state and validation props for {@link CommandStepperContent}.
 *
 * @remarks
 * `CommandStepperContent` is a private implementation primitive shared by
 * {@link CommandStepper} and `StepperCommandDialog` — it is deliberately not
 * re-exported from the `./CommandStepper` or `./CommandDialog` package
 * subpaths, so this type is documented for maintainers only.
 */
export interface CommandStepperContentProps extends StepperCustomizationProps {
    /** The active step index. */
    activeStep: number;
    /** The indices that have been visited. */
    visitedSteps: Set<number>;
    /** StepperPanel children defining each wizard step. */
    children?: React.ReactNode;
    /** Callback for active step changes. */
    onActiveStepChange?: (stepIndex: number) => void;
    /** Callback for visited step changes. */
    onVisitedStepsChange?: (visitedSteps: Set<number>) => void;
    /** Callback that receives validation state for each step. */
    onStepErrorsChange?: (stepErrors: boolean[]) => void;
    /** Provides validation errors for individual fields. */
    getFieldError?: (fieldName: string) => unknown;
    /** Whether to show built-in previous and next buttons. Defaults to `true`. */
    showNavigation?: boolean;
    /** Whether to show built-in submit on the last step. Defaults to `true`. */
    showSubmit?: boolean;
    /** Label for the next step button. Falls back to the provider's `stepper.next` message, then `'Next'`. */
    nextLabel?: string;
    /** Label for the previous step button. Falls back to the provider's `stepper.previous` message, then `'Previous'`. */
    previousLabel?: string;
    /** Label for the submit button. Falls back to the provider's `stepper.submit` message, then `'Submit'`. */
    okLabel?: string;
    /** Whether navigation controls are busy. */
    isBusy?: boolean;
    /** Whether submit is currently executing. */
    isSubmitting?: boolean;
    /** Locks form fields during a guarded submission without changing unguarded forms. */
    disableFieldsWhileSubmitting?: boolean;
    /** Disables submit regardless of current step state. */
    isSubmitDisabled?: boolean;
    /** Submit callback invoked on the last step. */
    onSubmit?: () => void | Promise<void>;
}

/**
 * @internal Renders the visual stepper body — step headers, panels, and the
 * built-in Previous / Next / Submit navigation — without any Arc
 * `CommandForm` wiring. This is a private implementation primitive shared by
 * {@link CommandStepper} and `StepperCommandDialog`; it is intentionally
 * **not** re-exported from the `./CommandStepper` or `./CommandDialog`
 * package subpaths and may change shape without a major version bump.
 */
export const CommandStepperContent = ({
    activeStep,
    visitedSteps,
    children,
    onActiveStepChange,
    onVisitedStepsChange,
    onStepErrorsChange,
    getFieldError,
    showNavigation = true,
    showSubmit = true,
    nextLabel,
    previousLabel,
    okLabel,
    isBusy = false,
    isSubmitting = false,
    disableFieldsWhileSubmitting = false,
    isSubmitDisabled = false,
    onSubmit,
    linear = true,
    orientation = 'horizontal',
    headerPosition = 'top',
    start,
    end,
    onChangeStep,
    pt,
}: CommandStepperContentProps) => {
    const { messages } = useCratisComponentsConfig();
    const stepperId = useId();
    const labels = resolveStepperLabels(messages, { nextLabel, previousLabel, okLabel });

    const {
        panels,
        currentStep,
        isFirstStep,
        isLastStep,
        stepErrors,
        isCurrentStepInvalid,
        hasAnyStepErrors,
        changeStep,
    } = useStepperState({
        children,
        activeStep,
        visitedSteps,
        linear,
        getFieldError,
        onStepErrorsChange,
        onActiveStepChange,
        onVisitedStepsChange,
        onChangeStep,
    });
    const isStepperBusy = isBusy || isSubmitting;

    const view = {
        panels,
        currentStep,
        visitedSteps,
        stepErrors,
        stepperId,
        isBusy: isStepperBusy,
        hasAnyStepErrors,
        pt,
    };
    const stepperList = (
        <CommandStepperList
            {...view}
            linear={linear}
            onHeaderClick={(index) => changeStep(index, true)}
        />
    );
    const stepperPanels = (
        <CommandStepperPanels
            {...view}
            disableFieldsWhileSubmitting={disableFieldsWhileSubmitting}
            isSubmitting={isSubmitting}
        />
    );

    const [first, second] = headerPosition === 'bottom'
        ? [stepperPanels, stepperList]
        : [stepperList, stepperPanels];

    return (
        <div
            className={`cratis-command-stepper cratis-command-stepper--${orientation}`}
            data-orientation={orientation}
        >
            {start}
            <div
                {...pt?.root}
                className={joinClassNames('cratis-command-stepper__root', pt?.root?.className)}
                data-cratis-part='root'
                data-cratis-component='CommandStepper'
                data-part='root'
                data-value={currentStep}
                data-orientation={orientation}
                data-busy={isStepperBusy || undefined}
                data-invalid={hasAnyStepErrors || undefined}
            >
                {first}
                {second}
            </div>
            {end}

            {showNavigation && (
                <CommandStepperNavigation
                    isFirstStep={isFirstStep}
                    isLastStep={isLastStep}
                    showSubmit={showSubmit}
                    isBusy={isBusy}
                    isSubmitting={isSubmitting}
                    isSubmitDisabled={isSubmitDisabled}
                    isCurrentStepInvalid={isCurrentStepInvalid}
                    hasAnyStepErrors={hasAnyStepErrors}
                    previousLabel={labels.previous}
                    nextLabel={labels.next}
                    okLabel={labels.ok}
                    onPrevious={() => changeStep(currentStep - 1)}
                    onNext={() => changeStep(currentStep + 1)}
                    onSubmit={onSubmit}
                />
            )}
        </div>
    );
};
