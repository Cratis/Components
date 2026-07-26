// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState, type CSSProperties } from 'react';
import { ICommandResult } from '@cratis/arc/commands';
import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';
import { Button } from 'primereact/button';
import {
    CommandForm,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps
} from '@cratis/arc.react/commands';
import { Dialog, type DialogProps, type CloseDialog, type ConfirmCallback, type CancelCallback } from '../Dialogs/Dialog';
import { CommandStepperContent, type StepperCustomizationProps } from './CommandStepper';
import { applyBeforeExecute, type BeforeExecuteCallback } from './applyBeforeExecute';

/**
 * Props for {@link StepperCommandDialog}. Combines the command-form props,
 * the stepper customization props (`linear`, `pt`, …), and dialog-specific
 * props for the outer modal.
 *
 * The Stepper customization props (`pt`/`ptOptions`/`unstyled`) target the
 * inner Stepper. To customize the outer Dialog use `dialogPt`, `dialogPtOptions`,
 * `dialogUnstyled`, and `dialogClassName`.
 *
 * @typeParam TCommand - The command record type.
 * @typeParam TResponse - The response payload type returned by a successful command.
 */
export interface StepperCommandDialogProps<TCommand extends object, TResponse = object>
    extends Omit<CommandFormProps<TCommand, TResponse>, 'children' | 'onBeforeExecute'>,
        StepperCustomizationProps {
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
    /** Dialog title text. */
    title: string;
    /** Controls dialog visibility. Defaults to `true`. */
    visible?: boolean;
    /** Dialog width. */
    width?: string;
    /** Custom CSS styles applied to the dialog. */
    style?: CSSProperties;
    /** Custom CSS styles applied to the dialog content area. */
    contentStyle?: CSSProperties;
    /** Whether the dialog can be resized. Defaults to `false`. */
    resizable?: boolean;
    /** Additional validity gate combined with command form validity. */
    isValid?: boolean;
    /** Fallback close callback. */
    onClose?: CloseDialog;
    /** Confirm callback — called only after successful command execution. */
    onConfirm?: ConfirmCallback;
    /** Cancel callback — invoked when the dialog is dismissed. */
    onCancel?: CancelCallback;
    /** Label for the submit button shown on the last step when valid. Defaults to `'Submit'`. */
    okLabel?: string;
    /** Label for the next step button. Defaults to `'Next'`. */
    nextLabel?: string;
    /** Label for the previous step button. Defaults to `'Previous'`. */
    previousLabel?: string;
    /**
     * Extra CSS class name forwarded to the underlying Cratis Dialog root.
     * Use the inherited `pt`/`ptOptions`/`unstyled` props to customize the Stepper.
     */
    dialogClassName?: string;
    /** PrimeReact pass-through configuration applied to the outer Dialog. */
    dialogPt?: DialogProps['pt'];
    /** PrimeReact pass-through options applied to the outer Dialog. */
    dialogPtOptions?: DialogProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the outer Dialog. */
    dialogUnstyled?: boolean;
    /** StepperPanel children defining each wizard step. */
    children?: React.ReactNode;
}

type StepperCommandDialogWrapperProps<TCommand extends object, TResponse = object> = {
    title: string;
    visible?: boolean;
    width?: string;
    style?: CSSProperties;
    contentStyle?: CSSProperties;
    resizable?: boolean;
    isValid?: boolean;
    onClose?: CloseDialog;
    onConfirm?: ConfirmCallback;
    onCancel?: CancelCallback;
    onSuccess?: CommandFormProps<TCommand, TResponse>['onSuccess'];
    onValidationFailure?: CommandFormProps<TCommand, TResponse>['onValidationFailure'];
    onFailed?: CommandFormProps<TCommand, TResponse>['onFailed'];
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
    okLabel?: string;
    nextLabel?: string;
    previousLabel?: string;
    dialogClassName?: string;
    dialogPt?: DialogProps['pt'];
    dialogPtOptions?: DialogProps['ptOptions'];
    dialogUnstyled?: boolean;
    children?: React.ReactNode;
} & StepperCustomizationProps;

const StepperCommandDialogWrapper = <TCommand extends object, TResponse = object>({
    title,
    visible = true,
    width = '600px',
    style,
    contentStyle,
    resizable = false,
    isValid,
    onClose,
    onConfirm,
    onCancel,
    onSuccess,
    onValidationFailure,
    onFailed,
    onBeforeExecute,
    okLabel = 'Submit',
    nextLabel = 'Next',
    previousLabel = 'Previous',
    linear = true,
    orientation,
    headerPosition,
    start,
    end,
    onChangeStep,
    pt,
    ptOptions,
    unstyled,
    dialogClassName,
    dialogPt,
    dialogPtOptions,
    dialogUnstyled,
    children
}: StepperCommandDialogWrapperProps<TCommand, TResponse>) => {
    const { setCommandValues, setCommandResult, isValid: isCommandFormValid, getFieldError } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();
    const [isBusy, setIsBusy] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
    const [stepErrors, setStepErrors] = useState<boolean[]>([]);

    // useDialogContext() is called unconditionally on every render — the try/catch only suppresses
    // the exception when the dialog is used standalone (outside a provider). React's Rules of Hooks
    // are not violated because the hook is always called; the try/catch never skips the call.
    let contextCloseDialog: ((result: DialogResult) => void) | undefined;
    try {
        const context = useDialogContext();
        contextCloseDialog = context?.closeDialog;
    } catch {
        contextCloseDialog = undefined;
    }

    const stepCount = React.Children.toArray(children).filter(React.isValidElement).length;
    const isLastStep = activeStep === stepCount - 1;
    const isFirstStep = activeStep === 0;
    const isDialogValid = isValid !== false && isCommandFormValid;
    const isCurrentStepInvalid = stepErrors[activeStep] ?? false;

    // Cancel/dismiss closing is owned by the outer Cratis Dialog (it runs the
    // user's onCancel/onClose and closes through the dialog host). This wrapper
    // only owns the success-close path — the custom Submit button cannot go
    // through the Dialog's own confirm button, so it closes through the context
    // itself after running the confirm gate.
    const closeAfterSuccess = async () => {
        let shouldClose = true;
        if (onConfirm) {
            const closeResult = await onConfirm();
            shouldClose = closeResult === true;
        } else if (onClose) {
            const closeResult = await onClose(DialogResult.Ok);
            shouldClose = closeResult !== false;
        }

        if (shouldClose) {
            contextCloseDialog?.(DialogResult.Ok);
        }
    };

    const handleSubmit = async () => {
        if (onBeforeExecute) {
            const applied = applyBeforeExecute(onBeforeExecute, commandInstance);
            setCommandValues(applied instanceof Promise ? await applied : applied);
        }

        setIsBusy(true);
        let result: ICommandResult<TResponse>;

        try {
            result = await (commandInstance as unknown as { execute: () => Promise<ICommandResult<TResponse>> }).execute();
        } finally {
            setIsBusy(false);
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
        await closeAfterSuccess();
    };

    const footer = (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
            {!isFirstStep && (
                <Button
                    variant="outlined"
                    onClick={() => setActiveStep(step => step - 1)}
                    disabled={isBusy}
                    style={{ width: 'auto' }}>
                    <i className="pi pi-arrow-left" />
                    <span>{previousLabel}</span>
                </Button>
            )}
            <div style={{ flex: 1 }} />
            {!isLastStep && (
                <Button
                    onClick={() => {
                        setVisitedSteps(previous => new Set(previous).add(activeStep));
                        setActiveStep(step => step + 1);
                    }}
                    disabled={isBusy || isCurrentStepInvalid}
                    style={{ width: 'auto' }}>
                    <span>{nextLabel}</span>
                    <i className="pi pi-arrow-right" />
                </Button>
            )}
            {isLastStep && isDialogValid && (
                <Button
                    onClick={handleSubmit}
                    disabled={isBusy}
                    autoFocus
                    style={{ width: 'auto' }}>
                    <i className={isBusy ? 'pi pi-spin pi-spinner' : 'pi pi-check'} />
                    <span>{okLabel}</span>
                </Button>
            )}
        </div>
    );

    return (
        <Dialog
            title={title}
            visible={visible}
            width={width}
            style={style}
            contentStyle={contentStyle}
            resizable={resizable}
            dismissable
            buttons={footer}
            onCancel={onCancel}
            onClose={onClose}
            className={dialogClassName}
            pt={dialogPt}
            ptOptions={dialogPtOptions}
            unstyled={dialogUnstyled}
        >
            <CommandStepperContent
                activeStep={activeStep}
                visitedSteps={visitedSteps}
                getFieldError={getFieldError}
                onActiveStepChange={setActiveStep}
                onVisitedStepsChange={setVisitedSteps}
                onStepErrorsChange={setStepErrors}
                showNavigation={false}
                showSubmit={false}
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
        </Dialog>
    );
};

/**
 * A multi-step wizard dialog backed by a single Cratis Arc command. Wraps
 * PrimeReact's `Stepper` inside a Cratis {@link Dialog}, tracks per-step
 * visit state, surfaces inline error indicators on steps with invalid
 * fields, and executes the bound command when the user submits the last
 * step. Use it when one command has enough fields that they should be
 * broken into named stages; for single-stage commands, use
 * {@link CommandDialog}.
 *
 * ## What `TCommand` is
 *
 * `TCommand` is the auto-generated TypeScript class produced by the Arc
 * proxy generator from a C# `[Command]` record. The wizard fields all bind
 * to properties on this single command — the multi-step UI is purely a
 * presentation grouping of one command's fields, not multiple commands.
 *
 * ## What's unique vs. {@link CommandDialog}
 *
 * - **Progressive disclosure**: fields are grouped into `<StepperPanel>`
 *   children and the user advances through them with explicit Previous /
 *   Next buttons before reaching Submit on the last step.
 * - **Per-step error indicators**: the step number circle paints red when
 *   any field inside that step has a validation error and the step has
 *   been visited, so a long wizard doesn't hide a single-field error on
 *   page 1 behind page 4. The CratisStepper handles this by reading
 *   `getFieldError` from the form context and inspecting which fields
 *   belong to which step.
 * - **Visited tracking**: only visited steps show error indicators; an
 *   un-visited step is never marked red just because its fields are blank.
 * - **Linear mode (default)**: the user must complete a step before
 *   advancing. Set `linear={false}` to allow free navigation.
 * - **Submit only fires on the last step**: the command runs through Arc's
 *   command pipeline only when the user clicks the final Submit button —
 *   not on every Next click. Failure paths
 *   (`onValidationFailure` / `onFailed`) work exactly like
 *   {@link CommandDialog}: dialog stays open, errors surface back to the
 *   form.
 *
 * ## Typed dialog host usage
 *
 * Same pattern as {@link CommandDialog} — combine with
 * `useDialog<CommandResult<TResponse>>()` from `@cratis/arc.react/dialogs`
 * to get a fully-typed result at the call site:
 *
 * ```tsx
 * import { useDialog, DialogResult } from '@cratis/arc.react/dialogs';
 * import { StepperCommandDialog, StepperPanel } from '@cratis/components/CommandDialog';
 * import { RegisterOrder } from './RegisterOrder';   // proxy from C#
 *
 * const RegisterOrderDialog = () => {
 *     const { closeDialog } = useDialogContext<CommandResult<RegisterOrderResponse>>();
 *     return (
 *         <StepperCommandDialog<RegisterOrder, RegisterOrderResponse>
 *             command={RegisterOrder}
 *             title="New order"
 *             onSuccess={() => closeDialog(DialogResult.Ok)}
 *             onCancel={() => closeDialog(DialogResult.Cancelled)}>
 *             <StepperPanel header="Customer">
 *                 <InputTextField value={c => c.customerName} title="Name" />
 *                 <InputTextField value={c => c.email} title="Email" />
 *             </StepperPanel>
 *             <StepperPanel header="Items">
 *                 <ChipsField value={c => c.items} title="Items" />
 *                 <NumberField value={c => c.quantity} title="Quantity" min={1} />
 *             </StepperPanel>
 *             <StepperPanel header="Confirm">
 *                 <CheckboxField value={c => c.confirmed} label="I confirm the order" />
 *             </StepperPanel>
 *         </StepperCommandDialog>
 *     );
 * };
 * ```
 *
 * ## Styling
 *
 * The inherited `pt` / `ptOptions` / `unstyled` props target the inner
 * **Stepper**. Use `dialogPt` / `dialogPtOptions` / `dialogUnstyled` /
 * `dialogClassName` to style the outer **Dialog** independently. See the
 * [pass-through cheat sheet](../../Documentation/Styling/pass-through.md)
 * for the slot reference.
 *
 * @typeParam TCommand - The command class (proxy generated from C# `[Command]`).
 * @typeParam TResponse - The success payload type returned by the command's `Handle()` method on the backend.
 * @param props - {@link StepperCommandDialogProps}.
 */
const StepperCommandDialogComponent = <TCommand extends object = object, TResponse = object>(
    props: StepperCommandDialogProps<TCommand, TResponse>
) => {
    const {
        title,
        visible,
        width,
        style,
        contentStyle,
        resizable,
        isValid,
        onClose,
        onConfirm,
        onCancel,
        onBeforeExecute,
        okLabel,
        nextLabel,
        previousLabel,
        linear,
        orientation,
        headerPosition,
        start,
        end,
        onChangeStep,
        pt,
        ptOptions,
        unstyled,
        dialogClassName,
        dialogPt,
        dialogPtOptions,
        dialogUnstyled,
        children,
        ...commandFormProps
    } = props;

    return (
        <CommandForm<TCommand, TResponse> {...commandFormProps}>
            <StepperCommandDialogWrapper<TCommand, TResponse>
                title={title}
                visible={visible}
                width={width}
                style={style}
                contentStyle={contentStyle}
                resizable={resizable}
                isValid={isValid}
                onClose={onClose}
                onConfirm={onConfirm}
                onCancel={onCancel}
                onSuccess={props.onSuccess}
                onValidationFailure={props.onValidationFailure}
                onFailed={props.onFailed}
                onBeforeExecute={onBeforeExecute}
                okLabel={okLabel}
                nextLabel={nextLabel}
                previousLabel={previousLabel}
                linear={linear}
                orientation={orientation}
                headerPosition={headerPosition}
                start={start}
                end={end}
                onChangeStep={onChangeStep}
                pt={pt}
                ptOptions={ptOptions}
                unstyled={unstyled}
                dialogClassName={dialogClassName}
                dialogPt={dialogPt}
                dialogPtOptions={dialogPtOptions}
                dialogUnstyled={dialogUnstyled}
            >
                {children}
            </StepperCommandDialogWrapper>
        </CommandForm>
    );
};

export const StepperCommandDialog = StepperCommandDialogComponent;
