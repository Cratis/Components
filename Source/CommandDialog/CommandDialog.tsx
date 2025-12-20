// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { ICommandResult } from '@cratis/arc/commands';
import { Constructor } from '@cratis/fundamentals';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import React, { createContext, useContext } from 'react';
import { CommandForm, useCommandFormContext, BeforeExecuteCallback } from '../CommandForm/CommandForm';
import { useCommandInstance } from '../CommandForm/CommandForm';

export type FieldValidator<TCommand> = (command: TCommand, fieldName: string, oldValue: unknown, newValue: unknown) => string | undefined;
export type FieldChangeCallback<TCommand> = (command: TCommand, fieldName: string, oldValue: unknown, newValue: unknown) => void;

export interface CommandDialogProps<TCommand, TResponse = object> {
    command: Constructor<TCommand>;
    initialValues?: Partial<TCommand>;
    currentValues?: unknown;
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

const CommandDialogFormContent = () => {
    const command = useCommandInstance<unknown>();
    const { setCommandResult, setCommandValues, isValid, onBeforeExecute } = useCommandFormContext();
    const { onSuccess: onConfirm, onCancel, confirmLabel, cancelLabel, confirmIcon, cancelIcon } = useCommandDialogContext();

    const handleConfirm = async () => {
        if (onBeforeExecute) {
            const transformedValues = onBeforeExecute(command);
            setCommandValues(transformedValues);
        }
        const result = await command.execute();
        if (result.isSuccess) {
            await onConfirm(result);
        } else {
            setCommandResult(result);
        }
    };

    const handleCancel = () => {
        onCancel();
    };

    return (
        <>
            <div className="card flex flex-wrap justify-content-center gap-3 mt-8">
                <Button label={confirmLabel} icon={confirmIcon} onClick={handleConfirm} disabled={!isValid} />
                <Button label={cancelLabel} icon={cancelIcon} severity='secondary' onClick={handleCancel} />
            </div>
        </>
    );
};

const CommandDialogFieldsWrapper = (props: { children: React.ReactNode }) => {
    React.Children.forEach(props.children, child => {
        if (React.isValidElement(child)) {
            const component = child.type as unknown;
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

const CommandDialogComponent = <TCommand, TResponse = object>(props: CommandDialogProps<TCommand, TResponse>) => {
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
        style = { width: '50vw' },
        width
    } = props;

    const dialogStyle = width ? { ...style, width } : style;

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
        <Dialog
            header={header}
            visible={visible}
            style={dialogStyle}
            onHide={onCancel}
            contentStyle={{ overflow: 'visible' }}
        >
            <CommandDialogContext.Provider value={contextValue}>
                <CommandForm command={command} initialValues={initialValues} currentValues={currentValues} onFieldValidate={onFieldValidate} onFieldChange={onFieldChange} onBeforeExecute={onBeforeExecute}>
                    {children}
                    <CommandDialogFormContent />
                </CommandForm>
            </CommandDialogContext.Provider>
        </Dialog>
    );
};

CommandDialogComponent.Fields = CommandDialogFieldsWrapper;

export const CommandDialog = CommandDialogComponent;
