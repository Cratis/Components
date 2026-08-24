// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import type { ICommandResult } from '@cratis/arc/commands';
import {
    CommandForm,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps,
} from '@cratis/arc.react/commands';
import { applyBeforeExecute, type BeforeExecuteCallback } from './applyBeforeExecute';
import {
    CommandStepperContent,
    type CommandStepperContentProps,
} from './CommandStepperContent';

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

/** Public layout, navigation, and stable-part customization shared by both steppers. */
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

/** Props for a standalone stepper bound to one Arc command form. */
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
