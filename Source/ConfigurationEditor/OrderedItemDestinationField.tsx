// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ConfigurationDestination } from './ConfigurationDestination';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemEditorParts } from './OrderedItemEditorParts';
import type { OrderedItemLabels } from './OrderedItemLabels';

interface DestinationFieldProps<TItem extends OrderedItem> {
    item: TItem;
    editable: boolean;
    itemName: string;
    labels: Required<OrderedItemLabels>;
    destinations: ReadonlyArray<ConfigurationDestination>;
    message: string | undefined;
    messageId: string;
    parts: OrderedItemEditorParts | undefined;
    onChange: (destination: string | undefined) => void;
}

const groupDestinations = (destinations: ReadonlyArray<ConfigurationDestination>) => {
    const ungrouped = destinations.filter((destination) => !destination.group);
    const groups = new Map<string, ConfigurationDestination[]>();
    for (const destination of destinations) {
        if (!destination.group) continue;
        groups.set(destination.group, [...(groups.get(destination.group) ?? []), destination]);
    }
    return { ungrouped, groups };
};

/**
 * The destination field of one item: a select over the host's destinations, or the destination's
 * name as text. A destination the host no longer lists stays selectable-as-current and is flagged.
 */
export const OrderedItemDestinationField = <TItem extends OrderedItem>({
    item,
    editable,
    itemName,
    labels,
    destinations,
    message,
    messageId,
    parts,
    onChange,
}: DestinationFieldProps<TItem>) => {
    const current = destinations.find((destination) => destination.id === item.destination);
    const missing = item.destination !== undefined && current === undefined;
    const feedback = message ?? (missing ? labels.destinationUnavailable : undefined);
    const accessibleName = `${labels.destinationField}: ${itemName}`;
    const { ungrouped, groups } = groupDestinations(destinations);

    return (
        <div className='cratis-ordered-item__destination'>
            {editable ? (
                <select
                    {...parts?.destination}
                    value={item.destination ?? ''}
                    aria-label={accessibleName}
                    aria-invalid={feedback ? true : undefined}
                    aria-describedby={feedback ? messageId : undefined}
                    onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
                    className={`cratis-ordered-item__input ${parts?.destination?.className ?? ''}`}
                    data-cratis-part='destination'
                    data-control='destination'
                    data-invalid={feedback ? true : undefined}
                >
                    <option value=''>{labels.noDestination}</option>
                    {missing && <option value={item.destination}>{labels.destinationUnavailable}</option>}
                    {ungrouped.map((destination) => (
                        <option key={destination.id} value={destination.id}>{destination.label}</option>
                    ))}
                    {[...groups.entries()].map(([group, members]) => (
                        <optgroup key={group} label={group}>
                            {members.map((destination) => (
                                <option key={destination.id} value={destination.id}>{destination.label}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            ) : (
                <span className='cratis-ordered-item__text' data-control='destination'>
                    <span className='cratis-ordered-item__hidden'>{accessibleName}: </span>
                    {current ? current.label : labels.noDestination}
                </span>
            )}
            {feedback && (
                <p {...parts?.message} id={messageId} role='alert' className={`cratis-ordered-item__message ${parts?.message?.className ?? ''}`} data-cratis-part='message' data-invalid>
                    {feedback}
                </p>
            )}
        </div>
    );
};
