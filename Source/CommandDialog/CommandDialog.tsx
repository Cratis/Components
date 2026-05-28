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

/**
 * Props for {@link CommandDialog}. Combines the props of a `CommandForm`
 * (`command`, `initialValues`, `onSuccess`, `onValidationFailure`, `onFailed`,
 * `onBeforeExecute`, etc.) with the props of a {@link Dialog} (`title`,
 * `buttons`, `width`, `pt`, `unstyled`, …).
 *
 * @typeParam TCommand - The command record type (must extend `object`).
 * @typeParam TResponse - The response payload type returned by a successful command. Defaults to `object`.
 */
export interface CommandDialogProps<TCommand extends object, TResponse = object>
    extends Omit<CommandFormProps<TCommand, TResponse>, 'children'>,
        Omit<DialogProps, 'children'> {
    /**
     * Form fields and arbitrary content for the dialog body. Children that are
     * `CommandFormField` instances are automatically wrapped so they bind to
     * the command instance.
     */
    children?: React.ReactNode;
}

const CommandDialogWrapper = <TCommand extends object, TResponse = object>({
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
    onSuccess,
    onValidationFailure,
    onFailed,
    onBeforeExecute,
    className,
    pt,
    ptOptions,
    unstyled,
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
    onSuccess?: CommandFormProps<TCommand, TResponse>['onSuccess'];
    onValidationFailure?: CommandFormProps<TCommand, TResponse>['onValidationFailure'];
    onFailed?: CommandFormProps<TCommand, TResponse>['onFailed'];
    onBeforeExecute?: (values: TCommand) => TCommand;
    className?: DialogProps['className'];
    pt?: DialogProps['pt'];
    ptOptions?: DialogProps['ptOptions'];
    unstyled?: DialogProps['unstyled'];
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
            return false;
        }

        await onSuccess?.(result.response as TResponse);

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
            className={className}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}
        >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {processedChildren}
            </div>
        </Dialog>
    );
};

/**
 * A {@link Dialog} that wraps a `CommandForm`, executes the bound command on
 * confirm, and closes only when the command succeeds. While the command is
 * running the dialog enters a busy state and disables its action buttons; on
 * validation or execution failure it stays open and propagates the result to
 * the form so field-level errors render automatically.
 *
 * Children that are `CommandFormField` instances bind to the command's
 * properties via the `value` accessor (`value={c => c.name}`); arbitrary
 * non-field children are rendered as plain content.
 *
 * ```tsx
 * <CommandDialog<RegisterAuthor> title="Register author"
 *                                command={RegisterAuthor}
 *                                onSuccess={onCreated}>
 *     <InputTextField value={c => c.name} title="Name" />
 *     <InputTextField value={c => c.email} title="Email" />
 * </CommandDialog>
 * ```
 *
 * @typeParam TCommand - The command record type. Defaults to `object`.
 * @typeParam TResponse - The success payload type. Defaults to `object`.
 * @param props - {@link CommandDialogProps}.
 */
const CommandDialogComponent = <TCommand extends object = object, TResponse = object>(props: CommandDialogProps<TCommand, TResponse>) => {
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
        className,
        pt,
        ptOptions,
        unstyled,
        children,
        ...commandFormProps
    } = props;

    return (
        <CommandForm<TCommand, TResponse> {...commandFormProps}>
            <CommandDialogWrapper<TCommand, TResponse>
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
                onSuccess={props.onSuccess}
                onValidationFailure={props.onValidationFailure}
                onFailed={props.onFailed}
                onBeforeExecute={commandFormProps.onBeforeExecute}
                className={className}
                pt={pt}
                ptOptions={ptOptions}
                unstyled={unstyled}
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
