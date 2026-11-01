// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import type { ComponentDescriptor } from './ComponentDescriptor';
import type { ComponentMarkerAttributes } from './ComponentMarkerAttributes';
import { componentMarker } from './componentMarker';
import {
    componentPreviewOverrides,
    registerComponentInstance,
    subscribeToComponentPreview,
    unregisterComponentInstance,
} from './componentInstances';

/**
 * Makes a component's presentation props visible to the component picker and previewable.
 *
 * The component calls this with the props it was rendered with, renders using the returned
 * (effective) props, and spreads the returned marker onto its root element. With no preview
 * active the effective props are the incoming props.
 * @param descriptor - The component's presentation-property descriptor.
 * @param props - The props the component was rendered with.
 * @param id - The consumer's `id` or `name`, when there is one.
 * @returns The effective props and the identity attributes for the root element.
 */
export const useComponentPresentation = <TProps extends object>(
    descriptor: ComponentDescriptor<TProps>,
    props: TProps,
    id?: string | null,
): [TProps, ComponentMarkerAttributes] => {
    const key = useId();
    const overrides = useSyncExternalStore(
        (listener) => subscribeToComponentPreview(key, listener),
        () => componentPreviewOverrides(key),
        () => componentPreviewOverrides(key),
    );

    useLayoutEffect(() => {
        registerComponentInstance(key, descriptor as ComponentDescriptor, props);
    });
    useLayoutEffect(() => () => unregisterComponentInstance(key), [key]);

    const marker = useMemo(
        () => ({ ...componentMarker(descriptor.component, id), 'data-cratis-component-instance': key }),
        [descriptor.component, id, key],
    );
    const effective = Object.keys(overrides).length === 0 ? props : ({ ...props, ...overrides } as TProps);
    return [effective, marker];
};
