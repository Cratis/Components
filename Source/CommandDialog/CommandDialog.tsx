// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ICommandResult } from '@cratis/arc/commands';
import { DialogButtons } from '@cratis/arc.react/dialogs';
import { Dialog } from '../Dialogs/Dialog';
import React from 'react';
import {
    CommandForm,
    CommandFormFieldWrapper,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps
} from '@cratis/arc.react/commands';

export interface CommandDialogProps<TCommand extends object, TResponse = object>
    extends Omit<CommandFormProps<TCommand>, 'children'> {
    visible?: boolean;
    header: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: (result: ICommandResult<TResponse>) => void | Promise<void>;
    onCancel: () => void;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    width?: string;
}

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
    visible?: boolean;
    width: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: (result: ICommandResult<unknown>) => void | Promise<void>;
    onCancel: () => void;
    onBeforeExecute?: (values: TCommand) => TCommand;
    children: React.ReactNode;
}) => {
    const { setCommandValues, setCommandResult, isValid } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();

    const handleConfirm = async () => {
        if (onBeforeExecute) {
            const transformedValues = onBeforeExecute(commandInstance);
            setCommandValues(transformedValues);
        }
        const result = await (commandInstance as unknown as { execute: () => Promise<ICommandResult<unknown>> }).execute();
        if (result.isSuccess) {
            await onConfirm(result);
            return false;
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
            isValid={isValid}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {processedChildren}
            </div>
        </Dialog>
    );
};

const CommandDialogComponent = <TCommand extends object = object, TResponse = object>(props: CommandDialogProps<TCommand, TResponse>) => {
    const {
        visible,
        header,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        onConfirm,
        onCancel,
        children,
        width = '50vw',
        ...commandFormProps
    } = props;

    return (
        <CommandForm<TCommand> {...commandFormProps}>
            <CommandDialogWrapper<TCommand>
                header={header}
                visible={visible}
                width={width}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                onConfirm={onConfirm}
                onCancel={onCancel}
                onBeforeExecute={commandFormProps.onBeforeExecute}
            >
                {children}
            </CommandDialogWrapper>
        </CommandForm>
    );
};

const CommandDialogColumnWrapper = ({ children }: { children: React.ReactNode }) => (
    <CommandForm.Column>{children}</CommandForm.Column>
);
CommandDialogColumnWrapper.displayName = 'CommandFormColumn';

CommandDialogComponent.Column = CommandDialogColumnWrapper;

export const CommandDialog = CommandDialogComponent;
