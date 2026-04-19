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
    children?: React.ReactNode;
} & StepperCustomizationProps) => {
    const { setCommandValues, setCommandResult, isValid: isCommandFormValid, getFieldError } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();
    const [isBusy, setIsBusy] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
    const [stepErrors, setStepErrors] = useState<boolean[]>([]);

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
        <div className="inline-flex align-items-center justify-content-center gap-2">
            <span className="font-bold white-space-nowrap">{title}</span>
        </div>
    );

    const footer = (
        <div className="flex align-items-center w-full gap-3">
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
            >
                {children}
            </StepperCommandDialogWrapper>
        </CommandForm>
    );
};

export const StepperCommandDialog = StepperCommandDialogComponent;
