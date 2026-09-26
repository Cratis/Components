// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Capture only the properties Arc will send, before an asynchronous confirmation can change them. */
export const snapshotCommandValues = (command: object): Record<string, unknown> => {
    const instance = command as { propertyDescriptors: { name: string }[] };
    const values = command as Record<string, unknown>;
    const snapshot: Record<string, unknown> = {};
    for (const { name } of instance.propertyDescriptors ?? []) {
        snapshot[name] = structuredClone(values[name]);
    }
    return snapshot;
};

const sameValue = (left: unknown, right: unknown): boolean => {
    if (Object.is(left, right)) return true;
    if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
    const kind = Object.prototype.toString.call(left);
    if (kind !== Object.prototype.toString.call(right)) return false;
    if (left instanceof Date && right instanceof Date) return Object.is(left.getTime(), right.getTime());
    if (left instanceof RegExp && right instanceof RegExp) return left.source === right.source && left.flags === right.flags;
    if (left instanceof Map && right instanceof Map) {
        if (left.size !== right.size) return false;
        return [...left].every(([key, value], index) => {
            const [otherKey, otherValue] = [...right][index];
            return sameValue(key, otherKey) && sameValue(value, otherValue);
        });
    }
    if (left instanceof Set && right instanceof Set) {
        if (left.size !== right.size) return false;
        return [...left].every((value, index) => sameValue(value, [...right][index]));
    }
    if (left instanceof ArrayBuffer && right instanceof ArrayBuffer) {
        return sameValue(new Uint8Array(left), new Uint8Array(right));
    }
    if (kind !== '[object Object]' && kind !== '[object Array]' && !ArrayBuffer.isView(left)) return false;
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    return keys.length === Object.keys(rightRecord).length &&
        keys.every((key) => Object.hasOwn(rightRecord, key) && sameValue(leftRecord[key], rightRecord[key]));
};

/** A changed form value invalidates approval, even if it is nested in a command property. */
export const commandValuesUnchanged = (command: object, snapshot: Record<string, unknown>): boolean => {
    const instance = command as { propertyDescriptors: { name: string }[] };
    const values = command as Record<string, unknown>;
    const descriptors = instance.propertyDescriptors ?? [];
    return descriptors.length === Object.keys(snapshot).length &&
        descriptors.every(({ name }) => Object.hasOwn(snapshot, name) && sameValue(snapshot[name], values[name]));
};
