// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyDescriptor } from './PropertyDescriptor';
import type { PropertyControlsParts } from './PropertyControlsParts';
import type { PropertyControlsLabels } from './PropertyControlsLabels';
import { usePropertyControl } from './usePropertyControl';
import { renderPropertyInput, renderPropertyLabel, renderPropertyMessages } from './PropertyControlInput';

const join = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

/** Props of the internal control that renders one property. */
export interface PropertyControlProps {
    descriptor: PropertyDescriptor;
    value: unknown;
    readOnly: boolean;
    message: string | undefined;
    labels: Required<PropertyControlsLabels>;
    parts: PropertyControlsParts | undefined;
    /** Reports a value the person entered. Returns a message when the entry is not acceptable. */
    onChange: (name: string, value: unknown) => string | undefined;
}

/** One labeled property control: text, number, on/off or choice, or its value as text when it cannot change. */
export const PropertyControl = (props: PropertyControlProps) => {
    const state = usePropertyControl(props);
    const { descriptor, parts, locked } = state;
    const control = renderPropertyInput(state);

    return (
        <div
            {...parts?.property}
            className={join('cratis-property', parts?.property?.className)}
            data-cratis-part='property'
            data-property={descriptor.name}
            data-kind={descriptor.kind}
            data-readonly={locked || undefined}
        >
            {renderPropertyLabel(state)}
            {control}
            {!locked && descriptor.kind === 'number' && descriptor.unit && (
                <span {...parts?.unit} className={join('cratis-property__unit', parts?.unit?.className)} data-cratis-part='unit'>
                    {descriptor.unit}
                </span>
            )}
            {renderPropertyMessages(state)}
        </div>
    );
};
