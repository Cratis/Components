// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useMemo } from 'react';
import { Command } from '@cratis/arc/commands';
import { CommandForm, CommandFormProps } from '@cratis/arc.react/commands';
import { resolveFieldTypeProvider } from './fieldTypeProviderRegistry';
import './defaultFieldTypeProviders';

/**
 * Props for {@link AutoCommandForm} - every {@link CommandFormProps} except `children`, which is
 * generated from the command's own properties instead of being written out by hand.
 */
export interface AutoCommandFormProps<TCommand extends object, TResponse = object> extends Omit<CommandFormProps<TCommand, TResponse>, 'children'> {
    /**
     * Property names to leave out of the generated field list - for a property that should not
     * be user-editable, or one a custom field placed elsewhere on the page already covers.
     */
    exclude?: (keyof TCommand)[];
}

function formatTitle(propertyName: string): string {
    return propertyName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, character => character.toUpperCase())
        .trim();
}

/**
 * A `CommandForm` that generates its field list from the command's own properties, choosing each
 * field's component by the property's type through the {@link FieldTypeProvider} registry -
 * `registerFieldTypeProvider` for a type the built-in defaults (`string`, `number`, `boolean`,
 * `Date`) don't cover, or to override one of them.
 *
 * A property whose type no registered provider handles is left out of the generated list -
 * `exclude` it explicitly for clarity, or add a `CommandForm` child by hand alongside this
 * component for that one property.
 *
 * @example
 * ```tsx
 * <AutoCommandForm command={RegisterInvoice} exclude={['invoiceId']} />
 * ```
 */
export function AutoCommandForm<TCommand extends object = object, TResponse = object>(
    props: AutoCommandFormProps<TCommand, TResponse>
): React.ReactElement {
    const { exclude, ...commandFormProps } = props;
    const propertyDescriptors = useMemo(() => (new props.command() as unknown as Command).propertyDescriptors, [props.command]);
    const excluded = useMemo(() => new Set<string>((exclude ?? []) as string[]), [exclude]);

    const fields = propertyDescriptors
        .filter(descriptor => !excluded.has(descriptor.name))
        .map(descriptor => {
            const provider = resolveFieldTypeProvider(descriptor);
            if (!provider) {
                return null;
            }

            const Field = provider.component;
            return (
                <Field
                    key={descriptor.name}
                    value={(instance: TCommand) => (instance as unknown as Record<string, unknown>)[descriptor.name]}
                    title={formatTitle(descriptor.name)}
                />
            );
        })
        .filter((field): field is React.ReactElement => field !== null);

    return <CommandForm {...commandFormProps}>{fields}</CommandForm>;
}
