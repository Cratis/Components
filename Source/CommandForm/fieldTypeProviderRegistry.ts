// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyDescriptor } from '@cratis/arc/reflection';
import { FieldTypeProvider } from './FieldTypeProvider';

const providers: FieldTypeProvider[] = [];

/**
 * Registers a {@link FieldTypeProvider} that {@link AutoCommandForm} consults when choosing which
 * field component to render for a command property.
 *
 * Providers are consulted most-recently-registered first, so a provider registered by consuming
 * application code overrides one of the built-in defaults for the same property type.
 * @param provider The provider to register.
 */
export function registerFieldTypeProvider(provider: FieldTypeProvider): void {
    providers.unshift(provider);
}

/**
 * Finds the first registered {@link FieldTypeProvider} that handles the given property.
 * @param propertyDescriptor The property to resolve a provider for.
 * @returns The matching provider, or undefined if none handles this property's type.
 */
export function resolveFieldTypeProvider(propertyDescriptor: PropertyDescriptor): FieldTypeProvider | undefined {
    return providers.find(provider => provider.canHandle(propertyDescriptor));
}

/**
 * Clears every registered provider, including the built-in defaults. Exposed for specs; a
 * consuming application should not normally call this.
 */
export function clearFieldTypeProviders(): void {
    providers.length = 0;
}
