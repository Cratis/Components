// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useMemo } from 'react';
import type { Command } from '@cratis/arc/commands';
import type { PropertyDescriptor } from '@cratis/arc/reflection';
import { Guid } from '@cratis/fundamentals';
import { GuidField } from './fields/GuidField';
import { registerDefaultFieldTypeProviders } from './defaultFieldTypeProviders';
import { resolveFieldTypeProvider } from './fieldTypeProviderRegistry';

registerDefaultFieldTypeProviders();

function formatTitle(propertyName: string): string {
    return propertyName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (character) => character.toUpperCase())
        .trim();
}

// An invalid GuidField draft leaves the command value empty, so a changed currentValues overlay must
// discard the draft even when the native value does not change. Only the registered GuidField itself
// receives the key: no other provider sees an extra prop.
function guidFieldResetProps(field: unknown, overlayValue: unknown): { resetKey?: unknown } {
    if (field !== GuidField) {
        return {};
    }
    return { resetKey: overlayValue instanceof Guid ? overlayValue.toString() : overlayValue };
}

/**
 * Reads the property descriptors of a command constructor. Metadata only: the instance is never executed.
 */
export function useCommandPropertyDescriptors(command: new () => object): PropertyDescriptor[] {
    // SAFETY: Arc command constructors expose the Command property-descriptor contract at runtime.
    return useMemo(() => (new command() as unknown as Command).propertyDescriptors, [command]);
}

/**
 * Memoises the set of excluded property names.
 */
export function useExcludedProperties<TCommand extends object>(exclude: (keyof TCommand)[] | undefined): Set<string> {
    return useMemo(() => new Set<string>((exclude ?? []) as string[]), [exclude]);
}

/**
 * Generates one keyed field element per descriptor that is not excluded and has a registered provider.
 */
export function generateFields<TCommand extends object>(
    propertyDescriptors: PropertyDescriptor[],
    excluded: Set<string>,
    currentValues: Partial<TCommand> | undefined,
): React.ReactElement[] {
    return propertyDescriptors
        .filter((descriptor) => !excluded.has(descriptor.name))
        .map((descriptor) => {
            const provider = resolveFieldTypeProvider(descriptor);
            if (!provider) {
                return null;
            }

            const Field = provider.component;
            return (
                <Field
                    key={descriptor.name}
                    {...guidFieldResetProps(Field, currentValues?.[descriptor.name as keyof TCommand])}
                    // The accessor reads the property dynamically, so CommandForm cannot infer the
                    // property name from its source text; fieldName states it explicitly.
                    fieldName={descriptor.name}
                    value={(instance: TCommand) => {
                        // SAFETY: Arc descriptors name runtime properties on the same command instance.
                        return (instance as unknown as Record<string, unknown>)[
                            descriptor.name
                        ];
                    }}
                    title={formatTitle(descriptor.name)}
                />
            );
        })
        .filter((field): field is React.ReactElement => field !== null);
}
