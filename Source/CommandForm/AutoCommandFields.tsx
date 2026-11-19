// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useContext, useMemo } from 'react';
import { CommandFormFieldWrapper, useCommandFormContext } from '@cratis/arc.react/commands';
import { CommandOverlayContext } from './commandOverlayContext';
import { generateFields, useCommandPropertyDescriptors, useExcludedProperties } from './generatedFields';

/**
 * Props for {@link AutoCommandFields}.
 */
export interface AutoCommandFieldsProps<TCommand extends object> {
    /**
     * Property names to leave out of the generated field list.
     */
    exclude?: (keyof TCommand)[];

    /**
     * A read-only reset hint: the same `currentValues` overlay passed to the host form. A change to a
     * property's value discards a generated `GuidField`'s unfinished draft, as in `AutoCommandForm`. It
     * never writes values; the host stays authoritative. Inside `CommandDialog` it defaults to the
     * dialog's own `currentValues`; pass it explicitly for a plain `CommandForm`.
     */
    currentValues?: Partial<TCommand>;
}

type FieldElement = Parameters<typeof CommandFormFieldWrapper>[0]['field'];

function useHostCommand<TCommand extends object>() {
    try {
        return useCommandFormContext<TCommand>().command;
    } catch {
        throw new Error('AutoCommandFields must be rendered inside a CommandForm or CommandDialog.');
    }
}

/**
 * Generates fields from the host command's own properties, using the same type providers, titles,
 * `exclude` and omission rules as {@link AutoCommandForm}, inside an existing `CommandForm` or
 * `CommandDialog`. It renders no form of its own; values, validation and execution belong to the host.
 * Each field binds itself to the host's command context. Steppers and column layouts are not supported.
 *
 * @example
 * ```tsx
 * <CommandDialog command={RenameProject} title='Rename project'>
 *     <AutoCommandFields<RenameProject> exclude={['projectId']} />
 * </CommandDialog>
 * ```
 */
export function AutoCommandFields<TCommand extends object = object>(
    props: AutoCommandFieldsProps<TCommand>,
): React.ReactElement {
    const command = useHostCommand<TCommand>();
    const dialogOverlay = useContext(CommandOverlayContext) as Partial<TCommand> | undefined;
    const propertyDescriptors = useCommandPropertyDescriptors(command as new () => object);
    const excluded = useExcludedProperties<TCommand>(props.exclude);
    const overlay = props.currentValues ?? dialogOverlay;
    const fields = useMemo(
        () => generateFields<TCommand>(propertyDescriptors, excluded, overlay),
        [propertyDescriptors, excluded, overlay],
    );

    return (
        <>
            {fields.map((field) => (
                // SAFETY: generated elements are command form field components with fieldName and value props.
                <CommandFormFieldWrapper key={field.key} field={field as unknown as FieldElement} />
            ))}
        </>
    );
}
