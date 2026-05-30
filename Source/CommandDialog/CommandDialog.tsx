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
 * A {@link Dialog} that hosts a Cratis Arc `CommandForm`, runs the bound
 * command on confirm, and only closes when the command succeeds. This is
 * the standard pattern for "user fills in a form, clicks OK, command runs
 * server-side, dialog dismisses" — `CommandDialog` collapses about thirty
 * lines of orchestration into the props on a single component.
 *
 * ## Where `TCommand` comes from
 *
 * `TCommand` is an auto-generated TypeScript class produced by the Arc proxy
 * generator from a C# `[Command]` record. `dotnet build` writes a `.ts` file
 * per command with the right property types and a typed `execute()` method;
 * importing the class is all the connection-to-the-backend you need. The
 * class also exposes a `.use()` hook for direct (non-dialog) usage and a
 * `useWithChangeTracking()` variant.
 *
 * ## What happens on confirm
 *
 * 1. If `onBeforeExecute` is supplied, it transforms the command values.
 *    Used for generated IDs (`Guid.create()`) that the user did not type in.
 * 2. The command's `execute()` runs through Arc's command pipeline. The
 *    backend handler returns either a typed response (mapped to `TResponse`)
 *    or a `ValidationResult[]`.
 * 3. On `IsSuccess: true`, `onSuccess(response)` fires and the dialog closes
 *    through the dialog host context.
 * 4. On a validation failure, `onValidationFailure(errors)` fires and the
 *    form's per-field error display is updated. The dialog stays open.
 * 5. On a domain or transport failure, `onFailed(result)` fires. The dialog
 *    stays open and the `CommandResult` is set on the form context so the
 *    UI can surface the error to the user.
 *
 * Throughout, the dialog is in the `isBusy` state — every action button is
 * disabled and the confirm button shows a spinner.
 *
 * ## Field binding
 *
 * Children that are `CommandFormField` instances (`InputTextField`,
 * `NumberField`, `DropdownField`, every `@cratis/components/CommandForm/fields`
 * widget) bind to a property on the command via the `value` accessor:
 *
 * ```tsx
 * <InputTextField value={c => c.name} title="Name" />
 * ```
 *
 * The accessor's argument is the command instance — TypeScript infers
 * `c.name` is a string and the field type-checks against that. Arbitrary
 * non-field children (custom layout, additional text, decorative elements)
 * are rendered as plain content.
 *
 * ## Typed dialog host usage
 *
 * Combine with `useDialog<CommandResult<TResponse>>()` from
 * `@cratis/arc.react/dialogs` to get a fully-typed result at the call site:
 *
 * ```tsx
 * import { useDialog, DialogResult } from '@cratis/arc.react/dialogs';
 * import { CommandDialog } from '@cratis/components/CommandDialog';
 * import { RegisterAuthor } from './RegisterAuthor';   // proxy from C#
 *
 * type RegisterAuthorResponse = { authorId: string };
 *
 * const RegisterAuthorDialog = () => {
 *     const { closeDialog } = useDialogContext<CommandResult<RegisterAuthorResponse>>();
 *     return (
 *         <CommandDialog<RegisterAuthor, RegisterAuthorResponse>
 *             command={RegisterAuthor}
 *             title="Register author"
 *             okLabel="Register"
 *             onSuccess={(response) => closeDialog(DialogResult.Ok)}
 *             onCancel={() => closeDialog(DialogResult.Cancelled)}>
 *             <InputTextField value={c => c.name}  title="Name" />
 *             <InputTextField value={c => c.email} title="Email" />
 *         </CommandDialog>
 *     );
 * };
 * ```
 *
 * ## What's special vs. raw Dialog + CommandForm
 *
 * - Confirm wiring (`onConfirm` → `commandInstance.execute()`) is handled
 *   internally; you only supply `onSuccess` / `onValidationFailure` / `onFailed`.
 * - The dialog's `isBusy` state tracks the in-flight command without manual
 *   `useState`.
 * - Field error propagation from `CommandResult.validationResults` to the
 *   form context is automatic.
 *
 * @typeParam TCommand - The command class (proxy generated from C# `[Command]`).
 * @typeParam TResponse - The success payload type returned by the command's `Handle()` method on the backend.
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
