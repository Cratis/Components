// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentMarkerAttributes } from '../configuration/identity/ComponentMarkerAttributes';

/** Keeps wrapper-owned choice identity on the label, not on its native input. */
export const splitChoiceMarker = <TProps extends object>(props: TProps) => {
    const {
        'data-cratis-component': component,
        'data-cratis-component-id': id,
        'data-cratis-component-instance': instance,
        ...nativeProps
    } = props as TProps & Partial<ComponentMarkerAttributes>;
    const marker: Partial<ComponentMarkerAttributes> = component === undefined ? {} : {
        'data-cratis-component': component,
        'data-cratis-component-id': id,
        'data-cratis-component-instance': instance,
    };
    return [nativeProps, marker] as const;
};
