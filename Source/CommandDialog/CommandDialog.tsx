// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ICommandResult } from '@cratis/arc/commands';
import { Constructor } from '@cratis/fundamentals';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dialog } from '../Dialogs/Dialog';
import React, { createContext, useContext } from 'react';
import { 
    CommandForm, 
    useCommandFormContext, 
    useCommandInstance
} from '@cratis/arc.react/commands';

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
    const { isValid, setCommandValues, setCommandResult } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();

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
            isValid={isValid}
        >
            {children}
        </Dialog>
    );
};

const CommandDialogFieldsWrapper = (props: { children: React.ReactNode }) => {
    React.Children.forEach(props.children, child => {
        if (React.isValidElement(child)) {
            const component = child.type as React.ComponentType<unknown>;
            if (component.displayName !== 'CommandFormField') {
                throw new Error(`Only CommandFormField components are allowed as children of CommandDialog.Fields. Got: ${component.displayName || component.name || 'Unknown'}`);
            }
        }
    });

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
        width = '50vw'
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
                onBeforeExecute={onBeforeExecute}>
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

CommandDialogComponent.Fields = CommandDialogFieldsWrapper;

export const CommandDialog = CommandDialogComponent;
