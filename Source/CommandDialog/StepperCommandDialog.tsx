// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ICommandResult } from '@cratis/arc/commands';
import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog as PrimeDialog, type DialogProps as PrimeDialogProps } from 'primereact/dialog';
import { Stepper as PrimeStepper, type StepperProps } from 'primereact/stepper';
import { Button } from 'primereact/button';
import React, { useMemo, useState } from 'react';
import {
    CommandForm,
    CommandFormFieldWrapper,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps
} from '@cratis/arc.react/commands';
import type { CloseDialog, ConfirmCallback, CancelCallback } from '../Dialogs/Dialog';
import './StepperCommandDialog.css';

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

/**
 * Stepper-specific customization props forwarded directly to PrimeReact Stepper.
 * `activeStep` and `children` are managed internally and are excluded.
 */
type StepperCustomizationProps = Pick<StepperProps,
    'orientation' | 'headerPosition' | 'linear' | 'onChangeStep' | 'start' | 'end' | 'pt' | 'ptOptions' | 'unstyled'
>;

export interface StepperCommandDialogProps<TCommand extends object>
    extends Omit<CommandFormProps<TCommand>, 'children'>,
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

const StepperCommandDialogWrapper = <TCommand extends object>({
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

    // Pre-compute the command property names for each StepperPanel step.
    // Used to determine whether a step has validation errors for the indicator badge.
    const stepFieldNames = useMemo(
        () => React.Children.toArray(children).map((step) => {
            if (!React.isValidElement(step)) return [] as string[];
            const stepProps = step.props as Record<string, unknown>;
            return extractFieldNamesFromNode(stepProps.children as React.ReactNode);
        }),
        [children]
    );

    const stepHasError = (stepIndex: number): boolean =>
        stepFieldNames[stepIndex]?.some(fieldName => !!(getFieldError?.(fieldName))) ?? false;

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
        let result: ICommandResult<unknown>;

        try {
            result = await (commandInstance as unknown as { execute: () => Promise<ICommandResult<unknown>> }).execute();
        } finally {
            setIsBusy(false);
        }

        if (!result.isSuccess) {
            setCommandResult(result);
            return;
        }

        await handleClose(DialogResult.Ok);
    };

    const processChildren = (nodes: React.ReactNode): React.ReactNode => {
        return React.Children.map(nodes, (child) => {
            if (!React.isValidElement(child)) return child;

            const component = child.type as React.ComponentType<unknown>;
            if (component.displayName === 'CommandFormField') {
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

    /**
     * Builds the passthrough `pt` object for PrimeStepper, injecting an inline
     * style onto the step *number* span to colour it red (errors) or green (visited
     * and valid). Targeting the number span — rather than the header `<li>` — means
     * PrimeReact's default `p-stepper-header` class and all its layout/separator
     * CSS are never disturbed.
     * Merges with any user-supplied `pt` prop.
     */
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
                    const hasError = stepFieldNames[idx]?.some(fieldName => !!(getFieldError?.(fieldName))) ?? false;
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
    }, [pt, stepFieldNames, getFieldError, visitedSteps]);

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
                    disabled={isBusy || stepHasError(activeStep)}
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
            <PrimeStepper
                activeStep={activeStep}
                linear={linear}
                orientation={orientation}
                headerPosition={headerPosition}
                onChangeStep={onChangeStep}
                start={start}
                end={end}
                pt={stepperPt as StepperProps['pt']}
                ptOptions={ptOptions}
                unstyled={unstyled}
            >
                {processChildren(children)}
            </PrimeStepper>
        </PrimeDialog>
    );
};

const StepperCommandDialogComponent = <TCommand extends object = object>(
    props: StepperCommandDialogProps<TCommand>
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
        <CommandForm<TCommand> {...commandFormProps}>
            <StepperCommandDialogWrapper<TCommand>
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
