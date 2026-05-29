// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ICommandResult } from '@cratis/arc/commands';
import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog as PrimeDialog, type DialogProps as PrimeDialogProps } from 'primereact/dialog';
import { Button } from 'primereact/button';
import React, { useState } from 'react';
import {
    CommandForm,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps
} from '@cratis/arc.react/commands';
import type { CloseDialog, ConfirmCallback, CancelCallback } from '../Dialogs/Dialog';
import { CommandStepperContent, type StepperCustomizationProps } from './CommandStepper';

/**
 * Props for {@link StepperCommandDialog}. Combines the command-form props,
 * the stepper customization props (`orientation`, `headerPosition`, `linear`,
 * `pt`, …), and dialog-specific props for the outer modal.
 *
 * The Stepper customization props (`pt`/`ptOptions`/`unstyled`) target the
 * inner Stepper. To customize the outer Dialog use `dialogPt`, `dialogPtOptions`,
 * `dialogUnstyled`, and `dialogClassName`.
 *
 * @typeParam TCommand - The command record type.
 * @typeParam TResponse - The response payload type returned by a successful command.
 */
export interface StepperCommandDialogProps<TCommand extends object, TResponse = object>
    extends Omit<CommandFormProps<TCommand, TResponse>, 'children'>,
        StepperCustomizationProps {
    /** Dialog title text. */
    title: string;
    /** Controls dialog visibility. Defaults to `true`. */
    visible?: boolean;
    /** Dialog width. */
    width?: string;
    /** Custom CSS styles applied to the dialog. */
    style?: PrimeDialogProps['style'];
    /** Custom CSS styles applied to the dialog content area. */
    contentStyle?: PrimeDialogProps['contentStyle'];
    /** Whether the dialog can be resized. Defaults to `false`. */
    resizable?: boolean;
    /** Additional validity gate combined with command form validity. */
    isValid?: boolean;
    /** Fallback close callback. */
    onClose?: CloseDialog;
    /** Confirm callback — called only after successful command execution. */
    onConfirm?: ConfirmCallback;
    /** Cancel callback — invoked when the dialog X button is clicked. */
    onCancel?: CancelCallback;
    /** Label for the submit button shown on the last step when valid. Defaults to `'Submit'`. */
    okLabel?: string;
    /** Label for the next step button. Defaults to `'Next'`. */
    nextLabel?: string;
    /** Label for the previous step button. Defaults to `'Previous'`. */
    previousLabel?: string;
    /**
     * Extra CSS class name forwarded to the underlying PrimeReact Dialog root.
     * Use the inherited `pt`/`ptOptions`/`unstyled` props to customize the Stepper.
     */
    dialogClassName?: string;
    /** PrimeReact pass-through configuration applied to the outer Dialog. */
    dialogPt?: PrimeDialogProps['pt'];
    /** PrimeReact pass-through options applied to the outer Dialog. */
    dialogPtOptions?: PrimeDialogProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the outer Dialog. */
    dialogUnstyled?: boolean;
    /** StepperPanel children defining each wizard step. */
    children?: React.ReactNode;
}

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
    orientation = 'horizontal',
    headerPosition,
    linear = true,
    onChangeStep,
    start,
    end,
    pt,
    ptOptions,
    unstyled,
    dialogClassName,
    dialogPt,
    dialogPtOptions,
    dialogUnstyled,
    children
}: {
    title: string;
    visible?: boolean;
    width?: string;
    style?: PrimeDialogProps['style'];
    contentStyle?: PrimeDialogProps['contentStyle'];
    resizable?: boolean;
    isValid?: boolean;
    onClose?: CloseDialog;
    onConfirm?: ConfirmCallback;
    onCancel?: CancelCallback;
    onSuccess?: CommandFormProps<TCommand, TResponse>['onSuccess'];
    onValidationFailure?: CommandFormProps<TCommand, TResponse>['onValidationFailure'];
    onFailed?: CommandFormProps<TCommand, TResponse>['onFailed'];
    onBeforeExecute?: (values: TCommand) => TCommand;
    okLabel?: string;
    nextLabel?: string;
    previousLabel?: string;
    dialogClassName?: string;
    dialogPt?: PrimeDialogProps['pt'];
    dialogPtOptions?: PrimeDialogProps['ptOptions'];
    dialogUnstyled?: boolean;
    children?: React.ReactNode;
} & StepperCustomizationProps) => {
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

    const stepCount = React.Children.count(children);
    const isLastStep = activeStep === stepCount - 1;
    const isFirstStep = activeStep === 0;
    const isDialogValid = isValid !== false && isCommandFormValid;
    const isCurrentStepInvalid = stepErrors[activeStep] ?? false;

    const handleClose = async (result: DialogResult) => {
        let shouldCloseThroughContext = true;

        if (result === DialogResult.Ok || result === DialogResult.Yes) {
            if (onConfirm) {
                const closeResult = await onConfirm();
                shouldCloseThroughContext = closeResult === true;
            } else if (onClose) {
                const closeResult = await onClose(result);
                shouldCloseThroughContext = closeResult !== false;
            }
        } else {
            if (onCancel) {
                const closeResult = await onCancel();
                shouldCloseThroughContext = closeResult === true;
            } else if (onClose) {
                const closeResult = await onClose(result);
                shouldCloseThroughContext = closeResult !== false;
            }
        }

        if (shouldCloseThroughContext) {
            contextCloseDialog?.(result);
        }
    };

    const handleSubmit = async () => {
        if (onBeforeExecute) {
            const transformedValues = onBeforeExecute(commandInstance);
            setCommandValues(transformedValues);
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

        await handleClose(DialogResult.Ok);
    };

    const headerElement = (
        <div className="inline-flex items-center justify-center gap-2">
            <span className="font-bold whitespace-nowrap">{title}</span>
        </div>
    );

    const footer = (
        <div className="flex items-center w-full gap-3">
            {!isFirstStep && (
                <Button
                    label={previousLabel}
                    icon="pi pi-arrow-left"
                    onClick={() => setActiveStep(s => s - 1)}
                    disabled={isBusy}
                    outlined
                />
            )}
            <div className="flex-1" />
            {!isLastStep && (
                <Button
                    label={nextLabel}
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    onClick={() => {
                        setVisitedSteps(prev => new Set(prev).add(activeStep));
                        setActiveStep(s => s + 1);
                    }}
                    disabled={isBusy || isCurrentStepInvalid}
                />
            )}
            {isLastStep && isDialogValid && (
                <Button
                    label={okLabel}
                    icon="pi pi-check"
                    onClick={handleSubmit}
                    loading={isBusy}
                    disabled={isBusy}
                    autoFocus
                />
            )}
        </div>
    );

    return (
        <PrimeDialog
            header={headerElement}
            modal
            footer={footer}
            onHide={() => handleClose(DialogResult.Cancelled)}
            visible={visible}
            style={{ width, ...style }}
            contentStyle={contentStyle}
            resizable={resizable}
            closable
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
                onChangeStep={onChangeStep}
                start={start}
                end={end}
                pt={pt}
                ptOptions={ptOptions}
                unstyled={unstyled}
            >
                {children}
            </CommandStepperContent>
        </PrimeDialog>
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
 * import { StepperCommandDialog } from '@cratis/components/CommandDialog';
 * import { StepperPanel } from 'primereact/stepperpanel';
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
        okLabel,
        nextLabel,
        previousLabel,
        orientation,
        headerPosition,
        linear,
        onChangeStep,
        start,
        end,
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
                onBeforeExecute={commandFormProps.onBeforeExecute}
                okLabel={okLabel}
                nextLabel={nextLabel}
                previousLabel={previousLabel}
                orientation={orientation}
                headerPosition={headerPosition}
                linear={linear}
                onChangeStep={onChangeStep}
                start={start}
                end={end}
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
