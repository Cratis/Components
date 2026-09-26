// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ICommandResult } from '@cratis/arc/commands';
import { DialogButtons, DialogResult } from '@cratis/arc.react/dialogs';
import { Dialog, type DialogProps } from '../Dialogs/Dialog';
import React from 'react';
import {
    CommandForm,
    CommandFormFieldWrapper,
    useCommandFormContext,
    useCommandInstance,
    type CommandFormProps,
} from '@cratis/arc.react/commands';
import { applyBeforeExecute, type BeforeExecuteCallback } from './applyBeforeExecute';
import { reportConfirmationError, type ConfirmBeforeExecute } from './confirmBeforeExecute';
import { useSubmissionFlight } from './useSubmissionFlight';
import {
    isCommandFormField,
    markAsCommandFormColumn,
} from '../CommandForm/commandFormMarkers';

/**
 * Props for {@link CommandDialog}. Combines the props of a `CommandForm`
 * (`command`, `initialValues`, `onSuccess`, `onValidationFailure`, `onFailed`,
 * `onBeforeExecute`, etc.) with the props of a {@link Dialog} (`title`,
 * `buttons`, `width`, `pt`, `unstyled`, …). Dialog presentation props
 * such as `subtitle`, `placement`, and `closeIcon` are forwarded to the dialog.
 *
 * @typeParam TCommand - The command record type (must extend `object`).
 * @typeParam TResponse - The response payload type returned by a successful command. Defaults to `object`.
 */
export interface CommandDialogProps<TCommand extends object, TResponse = object>
    extends
        Omit<CommandFormProps<TCommand, TResponse>, 'children' | 'onBeforeExecute'>,
        Omit<DialogProps, 'children' | 'isBusy'> {
    /**
     * A transformer invoked with the current command values immediately before
     * the command executes on confirm. It **must return** the values to run with
     * (mutated or not) — a callback that returns nothing does not execute the
     * command with `undefined`; the current values are kept and a warning is
     * logged. May be async.
     *
     * ⚠️ It runs **only on submit**, after the form has already been validated,
     * so a value produced here can never satisfy required-field validation — the
     * submit button stays disabled if a required value is only seeded here. Seed
     * required values through `initialValues`; reserve `onBeforeExecute` for
     * transforms that do not affect validity (for example a generated id).
     */
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;

    /**
     * Ask whether to run the command after validation and `onBeforeExecute`.
     * Receives the transformed values. Only `true` executes; all other outcomes
     * keep the dialog open. May return a promise (for example from a confirmation dialog).
     * Unlike `onConfirm`, this runs before execution, not after success.
     */
    confirmBeforeExecute?: ConfirmBeforeExecute<TCommand>;

    /**
     * Form fields and arbitrary content for the dialog body. Children that are
     * `CommandFormField` instances are automatically wrapped so they bind to
     * the command instance.
     */
    children?: React.ReactNode;
}

// Requiring each key here makes a newly added Dialog prop fail compilation until it is routed.
type ForwardedDialogProps = Omit<DialogProps, 'children' | 'isBusy'> &
    Record<keyof Omit<DialogProps, 'children' | 'isBusy'>, unknown>;

const CommandDialogWrapper = <TCommand extends object, TResponse = object>({
    isValid,
    onClose,
    onConfirm,
    onSuccess,
    onValidationFailure,
    onFailed,
    onException,
    onUnauthorized,
    onBeforeExecute,
    confirmBeforeExecute,
    children,
    ...dialogProps
}: Omit<DialogProps, 'isBusy'> & {
    onSuccess?: CommandFormProps<TCommand, TResponse>['onSuccess'];
    onValidationFailure?: CommandFormProps<TCommand, TResponse>['onValidationFailure'];
    onFailed?: CommandFormProps<TCommand, TResponse>['onFailed'];
    onException?: CommandFormProps<TCommand, TResponse>['onException'];
    onUnauthorized?: CommandFormProps<TCommand, TResponse>['onUnauthorized'];
    onBeforeExecute?: BeforeExecuteCallback<TCommand>;
    confirmBeforeExecute?: ConfirmBeforeExecute<TCommand>;
}) => {
    const {
        setCommandValues,
        setCommandResult,
        isValid: isCommandFormValid,
    } = useCommandFormContext<TCommand>();
    const commandInstance = useCommandInstance<TCommand>();
    const submission = useSubmissionFlight();

    const handleConfirm = async () => {
        if (!submission.begin()) return false;
        let result: ICommandResult<TResponse>;
        try {
            let values = commandInstance;
            if (onBeforeExecute) {
                const applied = applyBeforeExecute(onBeforeExecute, commandInstance);
                values = applied instanceof Promise ? await applied : applied;
                if (!submission.isMounted()) return false;
                setCommandValues(values);
            }
            if (confirmBeforeExecute) {
                let approved: boolean;
                try {
                    approved = await confirmBeforeExecute(values);
                } catch (error) {
                    if (submission.isMounted()) await reportConfirmationError(error, onException);
                    return false;
                }
                if (!submission.isMounted() || approved !== true) return false;
            }
            if (!submission.isMounted()) return false;
            // SAFETY: Arc command instances expose execute at runtime; the wrapper's public type omits it.
            result = await (
                commandInstance as unknown as {
                    execute: () => Promise<ICommandResult<TResponse>>;
                }
            ).execute();
        } finally {
            submission.finish();
        }

        if (!result.isSuccess) {
                await onFailed?.(result);
                if (result.hasExceptions) {
                    await onException?.(result.exceptionMessages, result.exceptionStackTrace);
                }
                if (!result.isAuthorized) await onUnauthorized?.();
                if (!result.isValid) {
                    await onValidationFailure?.(result.validationResults);
                }
                if (submission.isMounted()) setCommandResult(result);
                return false;
            }

            await onSuccess?.(result.response as TResponse);
            if (!submission.isMounted()) return false;
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
            if (isCommandFormField(component)) {
                type FieldElement = Parameters<
                    typeof CommandFormFieldWrapper
                >[0]['field'];
                // SAFETY: isCommandFormField guards that child.type is a command form field component.
                return (
                    <CommandFormFieldWrapper field={child as unknown as FieldElement} />
                );
            }

            const childProps = child.props as Record<string, unknown>;
            if (childProps.children != null) {
                return React.cloneElement(
                    child as React.ReactElement<Record<string, unknown>>,
                    {
                        children: processChildren(childProps.children as React.ReactNode),
                    },
                );
            }

            return child;
        });
    };

    const processedChildren = processChildren(children);
    const isDialogValid = isValid !== false && isCommandFormValid;

    return (
        <Dialog
            {...dialogProps}
            onClose={onClose}
            onConfirm={handleConfirm}
            isValid={isDialogValid}
            isBusy={submission.isSubmitting}
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
 * ## Destructive commands and initial focus
 *
 * The confirm button is focused when the dialog opens, and a focused native
 * button fires `click` from the `keydown` of `Enter`. A command whose form
 * has required fields is protected from a held or double-tapped `Enter` for
 * free, because `isCommandFormValid` keeps confirm disabled until something
 * is filled in. A command that takes **no** input — the typical "delete
 * this, permanently" command — has no such gate, so its confirm button is
 * armed the instant the dialog appears.
 *
 * Pass `initialFocus` (forwarded straight to {@link Dialog}) for those:
 *
 * ```tsx
 * <CommandDialog<DeletePerson>
 *     command={DeletePerson}
 *     title="Delete personal data?"
 *     okLabel="Delete"
 *     initialFocus={DialogInitialFocus.Cancel}
 *     onSuccess={() => closeDialog(DialogResult.Ok)}>
 *     This cannot be undone.
 * </CommandDialog>
 * ```
 *
 * Everything else — the footer, the close (X), `Escape`, and the confirm
 * wiring that runs the command — is untouched.
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
const CommandDialogComponent = <TCommand extends object = object, TResponse = object>(
    props: CommandDialogProps<TCommand, TResponse>,
) => {
    const {
        title,
        subtitle,
        placement,
        closeIcon,
        visible,
        width,
        style,
        contentStyle,
        resizable,
        buttons = DialogButtons.OkCancel,
        initialFocus,
        okLabel,
        cancelLabel,
        yesLabel,
        noLabel,
        dismissable,
        closeAriaLabel,
        isValid,
        onClose,
        onConfirm,
        onCancel,
        onBeforeExecute,
        confirmBeforeExecute,
        className,
        pt,
        ptOptions,
        unstyled,
        children,
        ...commandFormProps
    } = props;

    const dialogProps = {
        title,
        subtitle,
        placement,
        closeIcon,
        visible,
        width,
        style,
        contentStyle,
        resizable,
        buttons,
        initialFocus,
        okLabel,
        cancelLabel,
        yesLabel,
        noLabel,
        dismissable,
        closeAriaLabel,
        isValid,
        onClose,
        onConfirm,
        onCancel,
        className,
        pt,
        ptOptions,
        unstyled,
    } satisfies ForwardedDialogProps;

    return (
        <CommandForm<TCommand, TResponse> {...commandFormProps}>
            <CommandDialogWrapper<TCommand, TResponse>
                {...dialogProps}
                onSuccess={props.onSuccess}
                onValidationFailure={props.onValidationFailure}
                onFailed={props.onFailed}
                onException={props.onException}
                onUnauthorized={props.onUnauthorized}
                onBeforeExecute={onBeforeExecute}
                confirmBeforeExecute={confirmBeforeExecute}
            >
                {children}
            </CommandDialogWrapper>
        </CommandForm>
    );
};

const CommandDialogColumnWrapper = ({ children }: { children: React.ReactNode }) => (
    <CommandForm.Column>{children}</CommandForm.Column>
);
markAsCommandFormColumn(CommandDialogColumnWrapper);

CommandDialogComponent.Column = CommandDialogColumnWrapper;

/**
 * A {@link Dialog} that hosts a Cratis Arc `CommandForm`, runs the bound
 * command on confirm, and only closes when the command succeeds. This is
 * the standard pattern for "user fills in a form, clicks OK, command runs
 * server-side, dialog dismisses" — `CommandDialog` collapses about thirty
 * lines of orchestration into the props on a single component.
 *
 * See {@link CommandDialogComponent} for full documentation.
 *
 * @typeParam TCommand - The command class (proxy generated from C# `[Command]`).
 * @typeParam TResponse - The success payload type returned by the command's `Handle()` method on the backend.
 */
export const CommandDialog = CommandDialogComponent;
