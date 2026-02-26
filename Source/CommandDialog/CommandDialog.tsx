// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ICommandResult } from '@cratis/arc/commands';
import { Constructor } from '@cratis/fundamentals';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dialog } from '../Dialogs/Dialog';
import React, { createContext, useContext } from 'react';
import { 
    CommandForm, 
    CommandFormFieldWrapper,
    useCommandFormContext, 
    useCommandInstance
} from '@cratis/arc.react/commands';

type CommandFormProps = React.ComponentProps<typeof CommandForm>;

// Local type definitions
export type BeforeExecuteCallback<TCommand> = (values: TCommand) => TCommand;

export type FieldValidator<TCommand> = (command: TCommand, fieldName: string, oldValue: unknown, newValue: unknown) => string | undefined;
export type FieldChangeCallback<TCommand> = (command: TCommand, fieldName: string, oldValue: unknown, newValue: unknown) => void;

export interface CommandDialogProps<TCommand, TResponse = object> {
    command: Constructor<TCommand>;
    initialValues?: Partial<TCommand>;
    currentValues?: Partial<TCommand> | undefined;
    visible: boolean;
    header: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmIcon?: string;
    cancelIcon?: string;
    onConfirm: (result: ICommandResult<TResponse>) => void | Promise<void>;
    onCancel: () => void;
    onFieldValidate?: FieldValidator<TCommand>;
    onFieldChange?: FieldChangeCallback<TCommand>;
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    width?: string;
    showTitles?: boolean;
    showErrors?: boolean;
    validateOn?: CommandFormProps['validateOn'];
    validateAllFieldsOnChange?: boolean;
    validateOnInit?: boolean;
    autoServerValidate?: boolean;
    autoServerValidateThrottle?: number;
    fieldContainerComponent?: CommandFormProps['fieldContainerComponent'];
    fieldDecoratorComponent?: CommandFormProps['fieldDecoratorComponent'];
    errorDisplayComponent?: CommandFormProps['errorDisplayComponent'];
    tooltipComponent?: CommandFormProps['tooltipComponent'];
    errorClassName?: string;
    iconAddonClassName?: string;
}

interface CommandDialogContextValue<TCommand = unknown> {
    onSuccess: (result: ICommandResult<unknown>) => void | Promise<void>;
    onCancel: () => void;
    confirmLabel: string;
    cancelLabel: string;
    confirmIcon: string;
    cancelIcon: string;
    onFieldValidate?: FieldValidator<TCommand>;
    onFieldChange?: FieldChangeCallback<TCommand>;
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
}

const CommandDialogContext = createContext<CommandDialogContextValue<unknown> | undefined>(undefined);

export const useCommandDialogContext = <TCommand = unknown,>() => {
    const context = useContext(CommandDialogContext);
    if (!context) {
        throw new Error('useCommandDialogContext must be used within a CommandDialog');
    }
    return context as CommandDialogContextValue<TCommand>;
};

const CommandDialogWrapper = <TCommand extends object>({
    header,
    visible,
    width,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    onBeforeExecute,
    children
}: {
    header: string;
    visible: boolean;
    width: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: (result: ICommandResult<unknown>) => void | Promise<void>;
    onCancel: () => void;
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
    children: React.ReactNode;
}) => {
    const { setCommandValues, setCommandResult, isValid } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();

    const isDialogValid = isValid;

    const handleConfirm = async () => {
        if (onBeforeExecute) {
            const transformedValues = onBeforeExecute(commandInstance);
            setCommandValues(transformedValues);
        }
        const result = await (commandInstance as unknown as { execute: () => Promise<ICommandResult<unknown>> }).execute();
        if (result.isSuccess) {
            await onConfirm(result);
            return true;
        } else {
            setCommandResult(result);
            return false;
        }
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

    const processedChildren = processChildren(children);

    return (
        <Dialog
            title={header}
            visible={visible}
            width={width}
            onConfirm={handleConfirm}
            onCancel={onCancel}
            buttons={DialogButtons.OkCancel}
            okLabel={confirmLabel}
            cancelLabel={cancelLabel}
            isValid={isDialogValid}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {processedChildren}
            </div>
        </Dialog>
    );
};

const CommandDialogFieldsWrapper = (props: { children: React.ReactNode }) => {
    return (
        <CommandForm.Fields>
            {props.children}
        </CommandForm.Fields>
    );
};

const CommandDialogComponent = <TCommand extends object = object, TResponse = object>(props: CommandDialogProps<TCommand, TResponse>) => {
    const {
        command,
        initialValues,
        currentValues,
        visible,
        header,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        confirmIcon = 'pi pi-check',
        cancelIcon = 'pi pi-times',
        onConfirm,
        onCancel,
        onFieldValidate,
        onFieldChange,
        onBeforeExecute,
        children,
        width = '50vw',
        showTitles,
        showErrors,
        validateOn,
        validateAllFieldsOnChange,
        validateOnInit,
        autoServerValidate,
        autoServerValidateThrottle,
        fieldContainerComponent,
        fieldDecoratorComponent,
        errorDisplayComponent,
        tooltipComponent,
        errorClassName,
        iconAddonClassName
    } = props;

    const contextValue: CommandDialogContextValue<TCommand> = {
        onSuccess: onConfirm,
        onCancel,
        confirmLabel,
        cancelLabel,
        confirmIcon,
        cancelIcon,
        onFieldValidate,
        onFieldChange,
        onBeforeExecute
    };

    return (
        <CommandDialogContext.Provider value={contextValue}>
            <CommandForm
                command={command}
                initialValues={initialValues}
                currentValues={currentValues}
                onFieldValidate={onFieldValidate}
                onFieldChange={onFieldChange}
                onBeforeExecute={onBeforeExecute}
                showTitles={showTitles}
                showErrors={showErrors}
                validateOn={validateOn}
                validateAllFieldsOnChange={validateAllFieldsOnChange}
                validateOnInit={validateOnInit}
                autoServerValidate={autoServerValidate}
                autoServerValidateThrottle={autoServerValidateThrottle}
                fieldContainerComponent={fieldContainerComponent}
                fieldDecoratorComponent={fieldDecoratorComponent}
                errorDisplayComponent={errorDisplayComponent}
                tooltipComponent={tooltipComponent}
                errorClassName={errorClassName}
                iconAddonClassName={iconAddonClassName}>
                <CommandDialogWrapper
                    header={header}
                    visible={visible}
                    width={width}
                    confirmLabel={confirmLabel}
                    cancelLabel={cancelLabel}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    onBeforeExecute={onBeforeExecute}
                >
                    {children}
                </CommandDialogWrapper>
            </CommandForm>
        </CommandDialogContext.Provider>
    );
};

const CommandDialogColumnWrapper = ({ children }: { children: React.ReactNode }) => (
    <CommandForm.Column>{children}</CommandForm.Column>
);
CommandDialogColumnWrapper.displayName = 'CommandFormColumn';

CommandDialogComponent.Fields = CommandDialogFieldsWrapper;
CommandDialogComponent.Column = CommandDialogColumnWrapper;

export const CommandDialog = CommandDialogComponent;
