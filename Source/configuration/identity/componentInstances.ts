// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentDescriptor } from './ComponentDescriptor';
import { componentInstanceAttribute } from './componentIdentityAttributes';
import type { PresentationChange } from './PresentationChange';
import type { RegisteredComponent } from './RegisteredComponent';

interface Entry {
    descriptor?: ComponentDescriptor;
    props: Record<string, unknown>;
    previews: Map<symbol, Record<string, unknown>>;
    overrides: Readonly<Record<string, unknown>>;
    listeners: Set<() => void>;
}

const noOverrides: Readonly<Record<string, unknown>> = Object.freeze({});
const entries = new Map<string, Entry>();
const seenDescriptors = new Map<string, ComponentDescriptor>();

const ensure = (key: string): Entry => {
    let entry = entries.get(key);
    if (!entry) {
        entry = { props: {}, previews: new Map(), overrides: noOverrides, listeners: new Set() };
        entries.set(key, entry);
    }
    return entry;
};

const recompute = (entry: Entry) => {
    const merged: Record<string, unknown> = {};
    for (const preview of entry.previews.values()) Object.assign(merged, preview);
    entry.overrides = Object.keys(merged).length === 0 ? noOverrides : merged;
    for (const listener of [...entry.listeners]) listener();
};

/** Records the props a component instance was rendered with. Called by `useComponentPresentation`. */
export const registerComponentInstance = (
    key: string,
    descriptor: ComponentDescriptor,
    props: object,
): void => {
    const entry = ensure(key);
    entry.descriptor = descriptor;
    entry.props = props as Record<string, unknown>;
    seenDescriptors.set(descriptor.component, descriptor);
};

/** Removes a component instance when it unmounts. */
export const unregisterComponentInstance = (key: string): void => {
    entries.delete(key);
};

/** Subscribes to live-preview changes of one component instance. */
export const subscribeToComponentPreview = (key: string, listener: () => void): (() => void) => {
    const entry = ensure(key);
    entry.listeners.add(listener);
    return () => {
        entry.listeners.delete(listener);
    };
};

/** The live-preview overrides currently applied to one component instance. */
export const componentPreviewOverrides = (key: string): Readonly<Record<string, unknown>> =>
    entries.get(key)?.overrides ?? noOverrides;

/**
 * Reads what a rendered component registered, from the component root element.
 * @param element - A component root element (an element carrying `data-cratis-component`).
 * @returns The registration, or `undefined` when the component declares no presentation props.
 */
export const registeredComponentFor = (element: Element): RegisteredComponent | undefined => {
    const key = element.getAttribute(componentInstanceAttribute);
    const entry = key ? entries.get(key) : undefined;
    return entry?.descriptor ? { descriptor: entry.descriptor, props: entry.props } : undefined;
};

/**
 * Every descriptor registered so far, by component name. A component appears here once an
 * instance of it has rendered.
 */
export const knownComponentDescriptors = (): readonly ComponentDescriptor[] => [...seenDescriptors.values()];

/**
 * Applies proposed changes to a rendered component so a host can preview them live.
 * @param element - The component root element.
 * @param changes - The changes to apply.
 * @returns A function that removes exactly these changes again. Calling it twice is harmless.
 */
export const previewPresentationChanges = (
    element: Element,
    changes: readonly PresentationChange[],
): (() => void) => {
    const key = element.getAttribute(componentInstanceAttribute);
    const entry = key ? entries.get(key) : undefined;
    if (!entry) return () => undefined;
    const token = Symbol('preview');
    entry.previews.set(token, Object.fromEntries(changes.map((change) => [change.property, change.to])));
    recompute(entry);
    return () => {
        if (!entry.previews.delete(token)) return;
        recompute(entry);
    };
};
