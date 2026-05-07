// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useEffect, useMemo, useState } from 'react';
import { Stepper as PrimeStepper, type StepperProps } from 'primereact/stepper';
import { Button } from 'primereact/button';
import { ICommandResult } from '@cratis/arc/commands';
import {
    CommandForm,
    CommandFormFieldWrapper,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps
} from '@cratis/arc.react/commands';
import './CommandStepper.css';

/**
 * Stepper-specific customization props forwarded directly to PrimeReact Stepper.
 * `activeStep` and `children` are managed by the component.
 */
export type StepperCustomizationProps = Pick<StepperProps,
    'orientation' | 'headerPosition' | 'linear' | 'onChangeStep' | 'start' | 'end' | 'pt' | 'ptOptions' | 'unstyled'
>;

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
    /** Label for the next step button. Defaults to `'Next'`. */
    nextLabel?: string;
    /** Label for the previous step button. Defaults to `'Previous'`. */
    previousLabel?: string;
    /** Label for the submit button. Defaults to `'Submit'`. */
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

export interface CommandStepperProps<TCommand extends object, TResponse = object>
    extends Omit<CommandFormProps<TCommand, TResponse>, 'children'>,
        Omit<CommandStepperContentProps, 'activeStep' | 'visitedSteps' | 'onActiveStepChange' | 'onVisitedStepsChange' | 'getFieldError' | 'isSubmitting' | 'isSubmitDisabled' | 'onSubmit'> {
    /** StepperPanel children defining each wizard step. */
    children?: React.ReactNode;
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
        if ((component as { displayName?: string }).displayName === 'CommandFormField') {
            const fieldProps = child.props as { value?: (obj: unknown) => unknown };
            const name = getPropertyName(fieldProps.value);
            if (name) names.push(name);
        }

        const childProps = child.props as Record<string, unknown>;
        if (childProps.children != null) {
            names.push(...extractFieldNamesFromNode(childProps.children as React.ReactNode));
        }
    });
    return names;
};

const processChildren = (nodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(nodes, (child) => {
        if (!React.isValidElement(child)) return child;

        const component = child.type as React.ComponentType<unknown>;
        if ((component as { displayName?: string }).displayName === 'CommandFormField') {
            type FieldElement = Parameters<typeof CommandFormFieldWrapper>[0]['field'];
            return <CommandFormFieldWrapper field={child as unknown as FieldElement} />;
        }

        const childProps = child.props as Record<string, unknown>;
        if (childProps.children != null) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                children: processChildren(childProps.children as React.ReactNode)
            });
        }

        return child;
    });
};

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
    nextLabel = 'Next',
    previousLabel = 'Previous',
    okLabel = 'Submit',
    isBusy = false,
    isSubmitting = false,
    isSubmitDisabled = false,
    onSubmit,
    orientation = 'horizontal',
    headerPosition,
    linear = true,
    onChangeStep,
    start,
    end,
    pt,
    ptOptions,
    unstyled,
}: CommandStepperContentProps) => {
    const stepCount = React.Children.count(children);
    const isLastStep = activeStep >= stepCount - 1;
    const isFirstStep = activeStep <= 0;

    const stepFieldNames = useMemo(
        () => React.Children.toArray(children).map((step) => {
            if (!React.isValidElement(step)) return [] as string[];
            const stepProps = step.props as Record<string, unknown>;
            return extractFieldNamesFromNode(stepProps.children as React.ReactNode);
        }),
        [children]
    );

    const stepErrors = useMemo(
        () => stepFieldNames.map(fields => fields.some(fieldName => !!getFieldError?.(fieldName))),
        [stepFieldNames, getFieldError]
    );

    useEffect(() => {
        onStepErrorsChange?.(stepErrors);
    }, [onStepErrorsChange, stepErrors]);

    const isCurrentStepInvalid = stepErrors[activeStep] ?? false;
    const hasAnyStepErrors = stepErrors.some(hasError => hasError);

    const stepperPt = useMemo(() => {
        type StepContext = { context: { index: number } };
        type NumberPtFn = (opts: StepContext) => Record<string, unknown>;

        const userPt = pt as Record<string, unknown> | undefined;
        const userStepperPanelPt = userPt?.stepperpanel as Record<string, unknown> | undefined;
        const userNumberPt = userStepperPanelPt?.number;

        return {
            ...userPt,
            stepperpanel: {
                ...userStepperPanelPt,
                number: (opts: StepContext) => {
                    const existing: Record<string, unknown> =
                        typeof userNumberPt === 'function'
                            ? (userNumberPt as NumberPtFn)(opts)
                            : (userNumberPt as Record<string, unknown> | undefined) ?? {};
                    const idx = opts.context.index;
                    const hasError = stepErrors[idx] ?? false;
                    const isVisited = visitedSteps.has(idx);

                    const bgColor = hasError
                        ? 'var(--red-500, #ef4444)'
                        : isVisited
                            ? 'var(--green-500, #22c55e)'
                            : null;

                    if (!bgColor) return existing;
                    const existingStyle = existing.style as Record<string, unknown> | undefined;
                    return {
                        ...existing,
                        style: { ...existingStyle, backgroundColor: bgColor, color: '#fff' }
                    };
                }
            }
        };
    }, [pt, stepErrors, visitedSteps]);

    const handleChangeStep: StepperProps['onChangeStep'] = event => {
        onChangeStep?.(event);
        const index = (event as { index?: number }).index;
        if (typeof index === 'number') {
            if (index > activeStep && isCurrentStepInvalid) {
                return;
            }

            if (index > activeStep) {
                onVisitedStepsChange?.(new Set(visitedSteps).add(activeStep));
            }
            onActiveStepChange?.(index);
        }
    };

    const handlePrevious = () => {
        onActiveStepChange?.(Math.max(0, activeStep - 1));
    };

    const handleNext = () => {
        if (isCurrentStepInvalid) {
            return;
        }

        onVisitedStepsChange?.(new Set(visitedSteps).add(activeStep));
        onActiveStepChange?.(Math.min(stepCount - 1, activeStep + 1));
    };

    return (
        <div className="cratis-command-stepper">
            <PrimeStepper
                activeStep={activeStep}
                linear={linear}
                orientation={orientation}
                headerPosition={headerPosition}
                onChangeStep={handleChangeStep}
                start={start}
                end={end}
                pt={stepperPt as StepperProps['pt']}
                ptOptions={ptOptions}
                unstyled={unstyled}
            >
                {processChildren(children)}
            </PrimeStepper>

            {showNavigation && (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
                    {!isFirstStep && (
                        <Button
                            label={previousLabel}
                            icon="pi pi-arrow-left"
                            onClick={handlePrevious}
                            disabled={isBusy}
                            outlined
                            style={{ width: 'auto' }}
                        />
                    )}
                    <div style={{ flex: 1 }} />
                    {!isLastStep && (
                        <Button
                            label={nextLabel}
                            icon="pi pi-arrow-right"
                            iconPos="right"
                            onClick={handleNext}
                            disabled={isBusy || isSubmitting || isCurrentStepInvalid}
                            style={{ width: 'auto' }}
                        />
                    )}
                    {isLastStep && showSubmit && (
                        <Button
                            label={okLabel}
                            icon="pi pi-check"
                            onClick={() => void onSubmit?.()}
                            loading={isSubmitting}
                            disabled={isBusy || isSubmitting || isSubmitDisabled || hasAnyStepErrors}
                            autoFocus
                            style={{ width: 'auto' }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

type CommandStepperWrapperProps<TCommand extends object, TResponse = object> =
    Omit<
        CommandStepperContentProps,
        'activeStep' | 'visitedSteps' | 'onActiveStepChange' | 'onVisitedStepsChange' | 'getFieldError' | 'isSubmitting' | 'isSubmitDisabled' | 'onSubmit'
    > & {
        children?: React.ReactNode;
        onSuccess?: CommandFormProps<TCommand, TResponse>['onSuccess'];
        onValidationFailure?: CommandFormProps<TCommand, TResponse>['onValidationFailure'];
        onFailed?: CommandFormProps<TCommand, TResponse>['onFailed'];
        onBeforeExecute?: (values: TCommand) => TCommand;
    };

const CommandStepperWrapper = <TCommand extends object, TResponse = object>({
    children,
    onStepErrorsChange,
    showNavigation,
    showSubmit,
    nextLabel,
    previousLabel,
    okLabel,
    isBusy,
    orientation,
    headerPosition,
    linear,
    onChangeStep,
    start,
    end,
    pt,
    ptOptions,
    unstyled,
    onSuccess,
    onValidationFailure,
    onFailed,
    onBeforeExecute,
}: CommandStepperWrapperProps<TCommand, TResponse>) => {
    const { getFieldError, isValid: isCommandFormValid, setCommandValues, setCommandResult } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();
    const [activeStep, setActiveStep] = useState(0);
    const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (onBeforeExecute) {
            const transformedValues = onBeforeExecute(commandInstance);
            setCommandValues(transformedValues);
        }

        setIsSubmitting(true);
        let result: ICommandResult<TResponse>;

        try {
            result = await (commandInstance as unknown as { execute: () => Promise<ICommandResult<TResponse>> }).execute();
        } finally {
            setIsSubmitting(false);
        }

        if (!result.isSuccess) {
            if (!result.isValid) {
                await onValidationFailure?.(result.validationResults);
            } else {
                await onFailed?.(result);
            }
            setCommandResult(result);
            return;
        }

        await onSuccess?.(result.response as TResponse);
    };

    return (
        <CommandStepperContent
            activeStep={activeStep}
            visitedSteps={visitedSteps}
            onActiveStepChange={setActiveStep}
            onVisitedStepsChange={setVisitedSteps}
            onStepErrorsChange={onStepErrorsChange}
            getFieldError={getFieldError}
            showNavigation={showNavigation}
            showSubmit={showSubmit}
            nextLabel={nextLabel}
            previousLabel={previousLabel}
            okLabel={okLabel}
            isBusy={isBusy}
            isSubmitting={isSubmitting}
            isSubmitDisabled={!isCommandFormValid}
            onSubmit={handleSubmit}
            orientation={orientation}
            headerPosition={headerPosition}
            linear={linear}
            onChangeStep={onChangeStep}
            start={start}
            end={end}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}
        >
            {children}
        </CommandStepperContent>
    );
};

export const CommandStepper = <TCommand extends object = object, TResponse = object>(
    props: CommandStepperProps<TCommand, TResponse>
) => {
    const {
        children,
        onStepErrorsChange,
        showNavigation,
        showSubmit,
        nextLabel,
        previousLabel,
        okLabel,
        isBusy,
        orientation,
        headerPosition,
        linear,
        onChangeStep,
        start,
        end,
        pt,
        ptOptions,
        unstyled,
        ...commandFormProps
    } = props;

    return (
        <CommandForm<TCommand, TResponse> {...commandFormProps}>
            <CommandStepperWrapper<TCommand, TResponse>
                onStepErrorsChange={onStepErrorsChange}
                showNavigation={showNavigation}
                showSubmit={showSubmit}
                nextLabel={nextLabel}
                previousLabel={previousLabel}
                okLabel={okLabel}
                isBusy={isBusy}
                orientation={orientation}
                headerPosition={headerPosition}
                linear={linear}
                onChangeStep={onChangeStep}
                start={start}
                end={end}
                pt={pt}
                ptOptions={ptOptions}
                unstyled={unstyled}
                onSuccess={props.onSuccess}
                onValidationFailure={props.onValidationFailure}
                onFailed={props.onFailed}
                onBeforeExecute={commandFormProps.onBeforeExecute}
            >
                {children}
            </CommandStepperWrapper>
        </CommandForm>
    );
};
