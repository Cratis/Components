// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ICommandResult } from '@cratis/arc/commands';
import { DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';
import { Dialog, type DialogProps } from '../Dialogs/Dialog';
import React, { useState } from 'react';
import {
    CommandForm,
    CommandFormFieldWrapper,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps
} from '@cratis/arc.react/commands';

export interface CommandDialogProps<TCommand extends object>
    extends Omit<CommandFormProps<TCommand>, 'children'>,
        Omit<DialogProps, 'children'> {
    children?: React.ReactNode;
}

const CommandDialogWrapper = <TCommand extends object>({
    title,
    visible,
    width,
    style,
    contentStyle,
    resizable,
    buttons,
    okLabel,
    cancelLabel,
    yesLabel,
    noLabel,
    isValid,
    onClose,
    onConfirm,
    onCancel,
    onBeforeExecute,
    children
}: {
    title: string;
    visible?: boolean;
    width?: string;
    style?: DialogProps['style'];
    contentStyle?: DialogProps['contentStyle'];
    resizable?: boolean;
    buttons?: DialogProps['buttons'];
    okLabel?: string;
    cancelLabel?: string;
    yesLabel?: string;
    noLabel?: string;
    isValid?: boolean;
    onClose?: DialogProps['onClose'];
    onConfirm?: DialogProps['onConfirm'];
    onCancel?: DialogProps['onCancel'];
    onBeforeExecute?: (values: TCommand) => TCommand;
    children?: React.ReactNode;
}) => {
    const { setCommandValues, setCommandResult, isValid: isCommandFormValid } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();
    const [isBusy, setIsBusy] = useState(false);

    const handleConfirm = async () => {
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
            return false;
        }

        if (onConfirm) {
            const closeResult = await onConfirm();
            return closeResult === true;
        }

        if (onClose) {
            const closeResult = await onClose(DialogResult.Ok);
            return closeResult !== false;
        }

        return true;
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
    const isDialogValid = (isValid !== false) && isCommandFormValid;

    return (
        <Dialog
            title={title}
            visible={visible}
            width={width}
            style={style}
            contentStyle={contentStyle}
            resizable={resizable}
            buttons={buttons}
            onClose={onClose}
            onConfirm={handleConfirm}
            onCancel={onCancel}
            okLabel={okLabel}
            cancelLabel={cancelLabel}
            yesLabel={yesLabel}
            noLabel={noLabel}
            isValid={isDialogValid}
            isBusy={isBusy}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {processedChildren}
            </div>
        </Dialog>
    );
};

const CommandDialogComponent = <TCommand extends object = object>(props: CommandDialogProps<TCommand>) => {
    const {
        title,
        visible,
        width,
        style,
        contentStyle,
        resizable,
        buttons = DialogButtons.OkCancel,
        okLabel,
        cancelLabel,
        yesLabel,
        noLabel,
        isValid,
        onClose,
        onConfirm,
        onCancel,
        children,
        ...commandFormProps
    } = props;

    return (
        <CommandForm<TCommand> {...commandFormProps}>
            <CommandDialogWrapper<TCommand>
                title={title}
                visible={visible}
                width={width}
                style={style}
                contentStyle={contentStyle}
                resizable={resizable}
                buttons={buttons}
                okLabel={okLabel}
                cancelLabel={cancelLabel}
                yesLabel={yesLabel}
                noLabel={noLabel}
                isValid={isValid}
                onClose={onClose}
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
