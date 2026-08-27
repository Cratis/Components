// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useEffect, useMemo } from 'react';
import { Button } from '../Common/Button';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { CommandFormFieldWrapper } from '@cratis/arc.react/commands';
import { isCommandFormField } from '../CommandForm/commandFormMarkers';
import type { StepperPanelProps } from './StepperPanel';
import { getStepPanels } from './stepChildren';
import type { StepperCustomizationProps } from './CommandStepper';

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
    /** Disables submit regardless of current step state. */
    isSubmitDisabled?: boolean;
    /** Submit callback invoked on the last step. */
    onSubmit?: () => void | Promise<void>;
}

/** Extracts the property name from an accessor function like `c => c.name`. */
const getPropertyName = (accessor: ((obj: unknown) => unknown) | unknown): string => {
    if (typeof accessor !== 'function') return '';
    const fnStr = accessor.toString();
    const match = fnStr.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : '';
};

/** Recursively collects all CommandFormField property names from a React node tree. */
const extractFieldNamesFromNode = (nodes: React.ReactNode): string[] => {
    const names: string[] = [];
    React.Children.forEach(nodes, (child) => {
        if (!React.isValidElement(child)) return;
        const component = child.type as React.ComponentType<unknown>;
        if (isCommandFormField(component)) {
            const fieldProps = child.props as { value?: (obj: unknown) => unknown };
            const name = getPropertyName(fieldProps.value);
            if (name) names.push(name);
        }

        const childProps = child.props as Record<string, unknown>;
        if (childProps.children != null) {
            names.push(
                ...extractFieldNamesFromNode(childProps.children as React.ReactNode),
            );
        }
    });
    return names;
};

const processChildren = (nodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(nodes, (child) => {
        if (!React.isValidElement(child)) return child;

        const component = child.type as React.ComponentType<unknown>;
        if (isCommandFormField(component)) {
            type FieldElement = Parameters<typeof CommandFormFieldWrapper>[0]['field'];
            // SAFETY: displayName identifies the Arc command field shape before it reaches the wrapper.
            return <CommandFormFieldWrapper field={child as unknown as FieldElement} />;
        }

        const childProps = child.props as Record<string, unknown>;
        if (childProps.children != null) {
            return React.cloneElement(
                child as React.ReactElement<Record<string, unknown>>,
                {
                    children: processChildren(childProps.children as React.ReactNode),
                },
            );
        }

        return child;
    });
};

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
    const resolvedNextLabel = nextLabel ?? messages?.stepper?.next ?? 'Next';
    const resolvedPreviousLabel =
        previousLabel ?? messages?.stepper?.previous ?? 'Previous';
    const resolvedOkLabel = okLabel ?? messages?.stepper?.submit ?? 'Submit';

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
    const isLastStep = currentStep >= stepCount - 1;
    const isFirstStep = currentStep <= 0;

    const stepFieldNames = useMemo(
        () => panels.map((panel) => extractFieldNamesFromNode(panel.props.children)),
        [panels],
    );

    const stepErrors = useMemo(
        () =>
            stepFieldNames.map((fields) =>
                fields.some((fieldName) => !!getFieldError?.(fieldName)),
            ),
        [stepFieldNames, getFieldError],
    );

    useEffect(() => {
        onStepErrorsChange?.(stepErrors);
    }, [onStepErrorsChange, stepErrors]);

    const isCurrentStepInvalid = stepErrors[currentStep] ?? false;
    const hasAnyStepErrors = stepErrors.some((hasError) => hasError);

    const handleStepChange = (index: number) => {
        onChangeStep?.({ index });

        if (index > currentStep && isCurrentStepInvalid) {
            return;
        }

        if (index > currentStep) {
            onVisitedStepsChange?.(new Set(visitedSteps).add(currentStep));
        }
        onActiveStepChange?.(index);
    };

    const handlePrevious = () => {
        onActiveStepChange?.(Math.max(0, currentStep - 1));
    };

    const handleNext = () => {
        if (isCurrentStepInvalid) {
            return;
        }

        onVisitedStepsChange?.(new Set(visitedSteps).add(currentStep));
        onActiveStepChange?.(Math.min(stepCount - 1, currentStep + 1));
    };

    const isStepperBusy = isBusy || isSubmitting;

    const stepperList = (
        <ol
            {...pt?.list}
            className={['cratis-command-stepper__list', pt?.list?.className]
                .filter(Boolean)
                .join(' ')}
            data-cratis-part='list'
            data-part='list'
            data-busy={isStepperBusy || undefined}
            data-invalid={hasAnyStepErrors || undefined}
        >
            {panels.map((panel, index) => {
                const selected = index === currentStep;
                const visited = visitedSteps.has(index);
                const invalid = stepErrors[index] ?? false;
                const headerDisabled = isStepperBusy || (linear && !selected);

                return (
                    <li
                        {...pt?.step}
                        key={index}
                        className={[
                            'cratis-command-stepper__step',
                            pt?.step?.className,
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        data-cratis-part='step'
                        data-part='step'
                        data-active={selected || undefined}
                        data-selected={selected || undefined}
                        data-visited={visited || undefined}
                        data-invalid={invalid || undefined}
                        data-busy={isStepperBusy || undefined}
                    >
                        <button
                            {...pt?.header}
                            type='button'
                            className={[
                                'cratis-command-stepper__header',
                                pt?.header?.className,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            data-cratis-part='header'
                            data-part='header'
                            data-busy={isStepperBusy || undefined}
                            data-disabled={headerDisabled || undefined}
                            data-invalid={invalid || undefined}
                            data-selected={selected || undefined}
                            data-visited={visited || undefined}
                            disabled={headerDisabled}
                            aria-current={selected ? 'step' : undefined}
                            onClick={() => handleStepChange(index)}
                        >
                            <span
                                {...pt?.number}
                                className={[
                                    'cratis-command-stepper__number',
                                    pt?.number?.className,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                style={pt?.number?.style}
                                data-cratis-part='number'
                                data-part='number'
                                data-busy={isStepperBusy || undefined}
                                data-invalid={invalid || undefined}
                                data-selected={selected || undefined}
                                data-visited={visited || undefined}
                            >
                                {index + 1}
                            </span>
                            <span
                                {...pt?.title}
                                className={[
                                    'cratis-command-stepper__title',
                                    pt?.title?.className,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                data-cratis-part='title'
                                data-part='title'
                                data-busy={isStepperBusy || undefined}
                                data-invalid={invalid || undefined}
                                data-selected={selected || undefined}
                                data-visited={visited || undefined}
                            >
                                {panel.props.header}
                            </span>
                        </button>
                        {index < stepCount - 1 && (
                            <span
                                {...pt?.separator}
                                className={[
                                    'cratis-command-stepper__separator',
                                    pt?.separator?.className,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                data-cratis-part='separator'
                                data-part='separator'
                                data-busy={isStepperBusy || undefined}
                                data-invalid={invalid || undefined}
                                data-visited={visited || undefined}
                                aria-hidden='true'
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );

    const stepperPanels = (
        <div
            {...pt?.panels}
            className={['cratis-command-stepper__panels', pt?.panels?.className]
                .filter(Boolean)
                .join(' ')}
            data-cratis-part='panels'
            data-part='panels'
            data-busy={isStepperBusy || undefined}
            data-invalid={hasAnyStepErrors || undefined}
        >
            {panels.map((panel, index) => (
                <section
                    {...pt?.panel}
                    key={index}
                    hidden={index !== currentStep}
                    className={['cratis-command-stepper__panel', pt?.panel?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='panel'
                    data-part='panel'
                    data-busy={isStepperBusy || undefined}
                    data-invalid={stepErrors[index] || undefined}
                    data-selected={index === currentStep || undefined}
                    data-visited={visitedSteps.has(index) || undefined}
                    aria-label={String(panel.props.header ?? `Step ${index + 1}`)}
                >
                    {processChildren(panel.props.children)}
                </section>
            ))}
        </div>
    );

    return (
        <div
            className={`cratis-command-stepper cratis-command-stepper--${orientation}`}
            data-orientation={orientation}
        >
            {start}
            <div
                {...pt?.root}
                className={['cratis-command-stepper__root', pt?.root?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='root'
                data-part='root'
                data-value={currentStep}
                data-orientation={orientation}
                data-busy={isStepperBusy || undefined}
                data-invalid={hasAnyStepErrors || undefined}
            >
                {headerPosition === 'bottom' ? (
                    <>
                        {stepperPanels}
                        {stepperList}
                    </>
                ) : (
                    <>
                        {stepperList}
                        {stepperPanels}
                    </>
                )}
            </div>
            {end}

            {showNavigation && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: '0.75rem',
                    }}
                >
                    {!isFirstStep && (
                        <Button
                            variant='outline'
                            onClick={handlePrevious}
                            disabled={isBusy}
                            style={{ width: 'auto' }}
                        >
                            <span>{resolvedPreviousLabel}</span>
                        </Button>
                    )}
                    <div style={{ flex: 1 }} />
                    {!isLastStep && (
                        <Button
                            onClick={handleNext}
                            disabled={isBusy || isSubmitting || isCurrentStepInvalid}
                            style={{ width: 'auto' }}
                        >
                            <span>{resolvedNextLabel}</span>
                        </Button>
                    )}
                    {isLastStep && showSubmit && (
                        <Button
                            onClick={() => void onSubmit?.()}
                            disabled={
                                isBusy ||
                                isSubmitting ||
                                isSubmitDisabled ||
                                hasAnyStepErrors
                            }
                            autoFocus
                            style={{ width: 'auto' }}
                        >
                            {isSubmitting && (
                                <span
                                    className='cratis-dialog__spinner'
                                    aria-hidden='true'
                                />
                            )}
                            <span>{resolvedOkLabel}</span>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
