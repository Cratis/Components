// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { JsonSerializer } from '@cratis/fundamentals';

// Arc serializes a payload object; this also preserves its handling of optional undefined properties.
const serializeProperty = (name: string, value: unknown): string => JsonSerializer.serialize({ [name]: value });

/** Capture only the properties Arc will send, before an asynchronous confirmation can change them. */
export const snapshotCommandValues = (command: object): Record<string, string> => {
    const instance = command as { propertyDescriptors: { name: string }[] };
    const values = command as Record<string, unknown>;
    const snapshot: Record<string, string> = {};
    for (const { name } of instance.propertyDescriptors ?? []) {
        snapshot[name] = serializeProperty(name, values[name]);
    }
    return snapshot;
};

/** A changed form value invalidates approval, even if it is nested in a command property. */
export const commandValuesUnchanged = (command: object, snapshot: Record<string, string>): boolean => {
    const instance = command as { propertyDescriptors: { name: string }[] };
    const values = command as Record<string, unknown>;
    const descriptors = instance.propertyDescriptors ?? [];
    return descriptors.length === Object.keys(snapshot).length &&
        descriptors.every(({ name }) => Object.hasOwn(snapshot, name) && snapshot[name] === serializeProperty(name, values[name]));
};
