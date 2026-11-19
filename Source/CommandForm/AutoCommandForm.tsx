// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { CommandForm, type CommandFormProps } from '@cratis/arc.react/commands';
import { registerDefaultFieldTypeProviders } from './defaultFieldTypeProviders';
import { generateFields, useCommandPropertyDescriptors, useExcludedProperties } from './generatedFields';

registerDefaultFieldTypeProviders();

/**
 * Props for {@link AutoCommandForm} - every {@link CommandFormProps} except `children`, which is
 * generated from the command's own properties instead of being written out by hand.
 */
export interface AutoCommandFormProps<
    TCommand extends object,
    TResponse = object,
> extends Omit<CommandFormProps<TCommand, TResponse>, 'children'> {
    /**
     * Property names to leave out of the generated field list - for a property that should not
     * be user-editable, or one a custom field placed elsewhere on the page already covers.
     */
    exclude?: (keyof TCommand)[];

    /**
     * Optional content rendered after the generated fields, inside the native Arc form and
     * command context. Supply a submit control here when needed; no action is added by default.
     */
    footer?: React.ReactNode;
}

/**
 * A `CommandForm` that generates its field list from the command's own properties, choosing each
 * field's component by the property's type through the {@link FieldTypeProvider} registry -
 * `registerFieldTypeProvider` for a type the built-in defaults (`string`, `number`, `boolean`,
 * `Date`) don't cover, or to override one of them. `GuidField` is not a default; register it for
 * Fundamentals `Guid` properties to edit them.
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
    props: AutoCommandFormProps<TCommand, TResponse>,
): React.ReactElement {
    const { exclude, footer, ...commandFormProps } = props;
    const propertyDescriptors = useCommandPropertyDescriptors(props.command);
    const excluded = useExcludedProperties<TCommand>(exclude);
    const fields = generateFields<TCommand>(propertyDescriptors, excluded, props.currentValues);

    return (
        <CommandForm {...commandFormProps}>
            {fields}
            {footer}
        </CommandForm>
    );
}
