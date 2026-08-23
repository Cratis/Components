// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, {
    useEffect,
    useMemo,
    useState,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
} from 'react';
import { Button } from '../Common/Button';
import { ICommandResult } from '@cratis/arc/commands';
import {
    CommandForm,
    CommandFormFieldWrapper,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps,
} from '@cratis/arc.react/commands';
import { applyBeforeExecute, type BeforeExecuteCallback } from './applyBeforeExecute';
import { isCommandFormField } from '../CommandForm/commandFormMarkers';
import type { StepperPanelProps } from './StepperPanel';
import { getStepPanels } from './stepChildren';

/**
 * Event passed to {@link StepperCustomizationProps.onChangeStep} when the user
 * navigates to a different step.
 */
export interface StepperChangeEvent {
    /** Zero-based index of the step being navigated to. */
    index: number;
}

/** Orientation of a {@link CommandStepper} / {@link StepperCommandDialog}. */
export type StepperOrientation = 'horizontal' | 'vertical';

/** Where the step headers sit relative to the panels. */
export type StepperHeaderPosition = 'top' | 'bottom';

/**
 * Stepper-specific customization surface exposed by {@link CommandStepper} and
 * {@link StepperCommandDialog}. This is a Cratis-owned type — it no longer
 * leaks renderer-specific stepper props — so the Cratis-owned Stepper
 * can evolve underneath without changing the public API. Orientation, start/end
 * content, and header position are implemented over stable Cratis parts.
 */
export interface StepperParts {
    /** Stepper composition root. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Ordered step-header list. */
    list?: HTMLAttributes<HTMLOListElement>;
    /** One step list item and its state attributes. */
    step?: HTMLAttributes<HTMLLIElement>;
    /** Interactive step-header button. */
    header?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Step number/status indicator. */
    number?: HTMLAttributes<HTMLSpanElement>;
    /** Step title. */
    title?: HTMLAttributes<HTMLSpanElement>;
    /** Visual separator between steps. */
    separator?: HTMLAttributes<HTMLSpanElement>;
    /** Panels wrapper. */
    panels?: HTMLAttributes<HTMLDivElement>;
    /** Active step panel. */
    panel?: HTMLAttributes<HTMLElement>;
}

export interface StepperCustomizationProps {
    /**
     * Whether the wizard is linear. In linear mode the step headers are not
     * directly clickable — the user advances through the Previous / Next
     * buttons. Set to `false` to let the user jump between steps by clicking
     * their headers. Defaults to `true`.
     */
    linear?: boolean;
    /** Lays the steps out horizontally (default) or stacked vertically. */
    orientation?: StepperOrientation;
    /** Places the step-header row above (default) or below the panels. */
    headerPosition?: StepperHeaderPosition;
    /** Content rendered before the stepper (e.g. a logo or title). */
    start?: React.ReactNode;
    /** Content rendered after the stepper. */
    end?: React.ReactNode;
    /** Invoked when the active step changes (via navigation or a header click). */
    onChangeStep?: (event: StepperChangeEvent) => void;
    /** Cratis-owned per-part attributes for the stepper. */
    pt?: StepperParts;
    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;
    /** Retained for source compatibility; consumers always own the CSS. */
    unstyled?: boolean;
}

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
    extends
        Omit<CommandFormProps<TCommand, TResponse>, 'children' | 'onBeforeExecute'>,
        Omit<
            CommandStepperContentProps,
            | 'activeStep'
            | 'visitedSteps'
            | 'onActiveStepChange'
            | 'onVisitedStepsChange'
            | 'getFieldError'
            | 'isSubmitting'
            | 'isSubmitDisabled'
            | 'onSubmit'
        > {
    /**
     * A transformer invoked with the current command values immediately before
     * the command executes on submit. It **must return** the values to run with
     * (mutated or not) — a callback that returns nothing does not execute the
     * command with `undefined`; the current values are kept and a warning is
     * logged. May be async.
     *
     * ⚠️ It runs **only on submit**, after every step has already been validated,
     * so a value produced here can never satisfy required-field validation. Seed
     * required values through `initialValues`; reserve `onBeforeExecute` for
     * transforms that do not affect validity (for example a generated id).
     */
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
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
    linear = true,
    orientation = 'horizontal',
    headerPosition = 'top',
    start,
    end,
    onChangeStep,
    pt,
}: CommandStepperContentProps) => {
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

    const stepperList = (
        <ol
            {...pt?.list}
            className={['cratis-command-stepper__list', pt?.list?.className]
                .filter(Boolean)
                .join(' ')}
            data-cratis-part='list'
            data-part='list'
        >
            {panels.map((panel, index) => (
                <li
                    {...pt?.step}
                    key={index}
                    className={['cratis-command-stepper__step', pt?.step?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='step'
                    data-part='step'
                    data-active={index === currentStep || undefined}
                    data-visited={visitedSteps.has(index) || undefined}
                    data-invalid={stepErrors[index] || undefined}
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
                        disabled={linear && index !== currentStep}
                        aria-current={index === currentStep ? 'step' : undefined}
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
                            aria-hidden='true'
                        />
                    )}
                </li>
            ))}
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
                            outlined
                            onClick={handlePrevious}
                            disabled={isBusy}
                            style={{ width: 'auto' }}
                        >
                            <span>{previousLabel}</span>
                        </Button>
                    )}
                    <div style={{ flex: 1 }} />
                    {!isLastStep && (
                        <Button
                            onClick={handleNext}
                            disabled={isBusy || isSubmitting || isCurrentStepInvalid}
                            style={{ width: 'auto' }}
                        >
                            <span>{nextLabel}</span>
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
                            <span>{okLabel}</span>
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

type CommandStepperWrapperProps<TCommand extends object, TResponse = object> = Omit<
    CommandStepperContentProps,
    | 'activeStep'
    | 'visitedSteps'
    | 'onActiveStepChange'
    | 'onVisitedStepsChange'
    | 'getFieldError'
    | 'isSubmitting'
    | 'isSubmitDisabled'
    | 'onSubmit'
> & {
    children?: React.ReactNode;
    onSuccess?: CommandFormProps<TCommand, TResponse>['onSuccess'];
    onValidationFailure?: CommandFormProps<TCommand, TResponse>['onValidationFailure'];
    onFailed?: CommandFormProps<TCommand, TResponse>['onFailed'];
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
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
    linear,
    orientation,
    headerPosition,
    start,
    end,
    onChangeStep,
    pt,
    ptOptions,
    unstyled,
    onSuccess,
    onValidationFailure,
    onFailed,
    onBeforeExecute,
}: CommandStepperWrapperProps<TCommand, TResponse>) => {
    const {
        getFieldError,
        isValid: isCommandFormValid,
        setCommandValues,
        setCommandResult,
    } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();
    const [activeStep, setActiveStep] = useState(0);
    const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (onBeforeExecute) {
            const applied = applyBeforeExecute(onBeforeExecute, commandInstance);
            setCommandValues(applied instanceof Promise ? await applied : applied);
        }

        setIsSubmitting(true);
        let result: ICommandResult<TResponse>;

        try {
            // SAFETY: Arc command instances expose execute at runtime; the wrapper's public type omits it.
            result = await (
                commandInstance as unknown as {
                    execute: () => Promise<ICommandResult<TResponse>>;
                }
            ).execute();
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
            linear={linear}
            orientation={orientation}
            headerPosition={headerPosition}
            start={start}
            end={end}
            onChangeStep={onChangeStep}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}
        >
            {children}
        </CommandStepperContent>
    );
};

/**
 * A multi-step wizard backed by a single Cratis Arc command — the embedded,
 * non-modal counterpart of {@link StepperCommandDialog}. Renders directly
 * inside a page region (a panel, a route, a wizard view) rather than inside
 * a modal dialog. Use this when the wizard *is* the page; use
 * {@link StepperCommandDialog} when the same wizard should appear over the
 * current page in a modal.
 *
 * ## Mechanics
 *
 * - Wraps the Cratis-owned Stepper inside an Arc `CommandForm` so each
 *   `<StepperPanel>` becomes a logical grouping of fields that all bind to
 *   the same single command.
 * - Provides a built-in Previous / Next / Submit footer. The Submit button
 *   only appears on the last step and only when the form passes its
 *   validity gate.
 * - Steps with field errors are visually marked (red step indicator) so
 *   the user can see at a glance which step needs attention — useful in
 *   wizards long enough that a missed-required-field on page 1 would
 *   otherwise be hidden behind page 4.
 * - On final Submit, the bound command runs through Arc's command pipeline.
 *   Failure paths (`onValidationFailure` / `onFailed`) keep the wizard
 *   open and re-surface field errors automatically.
 *
 * ## What `TCommand` is
 *
 * `TCommand` is the auto-generated TypeScript class produced by the Arc
 * proxy generator from a C# `[Command]` record. The wizard's UI is a
 * presentation grouping of one command's fields — every panel binds to
 * properties on the same single command instance.
 *
 * ## What's unique vs. {@link StepperCommandDialog}
 *
 * Mechanically identical, but lives inline on a page instead of inside a
 * modal Dialog. There is no `dialogPt` / `dialogUnstyled` prop because
 * there is no outer dialog — `pt` / `ptOptions` / `unstyled` target the
 * Stepper directly.
 *
 * ```tsx
 * import { CommandStepper, StepperPanel } from '@cratis/components/CommandDialog';
 * import { RegisterAuthor } from './RegisterAuthor';   // proxy from C#
 *
 * export const RegisterAuthorPage = () => (
 *     <CommandStepper<RegisterAuthor> command={RegisterAuthor}
 *                                     onSuccess={() => navigate('/authors')}>
 *         <StepperPanel header="Basics">
 *             <InputTextField value={c => c.name} title="Name" />
 *         </StepperPanel>
 *         <StepperPanel header="Contact">
 *             <InputTextField value={c => c.email} title="Email" />
 *         </StepperPanel>
 *     </CommandStepper>
 * );
 * ```
 *
 * @typeParam TCommand - The command class (proxy generated from C# `[Command]`).
 * @typeParam TResponse - The success payload type returned by the command's `Handle()` method on the backend.
 * @param props - {@link CommandStepperProps}.
 */
export const CommandStepper = <TCommand extends object = object, TResponse = object>(
    props: CommandStepperProps<TCommand, TResponse>,
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
        linear,
        orientation,
        headerPosition,
        start,
        end,
        onChangeStep,
        pt,
        ptOptions,
        unstyled,
        onBeforeExecute,
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
                linear={linear}
                orientation={orientation}
                headerPosition={headerPosition}
                start={start}
                end={end}
                onChangeStep={onChangeStep}
                pt={pt}
                ptOptions={ptOptions}
                unstyled={unstyled}
                onSuccess={props.onSuccess}
                onValidationFailure={props.onValidationFailure}
                onFailed={props.onFailed}
                onBeforeExecute={onBeforeExecute}
            >
                {children}
            </CommandStepperWrapper>
        </CommandForm>
    );
};
