// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { ConfigurationIconReference } from './ConfigurationIconReference';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemEditorParts } from './OrderedItemEditorParts';
import type { OrderedItemIconFieldProps } from './OrderedItemIconFieldProps';
import type { OrderedItemLabels } from './OrderedItemLabels';

interface IconFieldProps<TItem extends OrderedItem> {
    item: TItem;
    editable: boolean;
    itemName: string;
    labels: Required<OrderedItemLabels>;
    message: string | undefined;
    messageId: string;
    parts: OrderedItemEditorParts | undefined;
    renderIconField?: (props: OrderedItemIconFieldProps<TItem>) => ReactNode;
    isIconAvailable?: (icon: ConfigurationIconReference) => boolean;
    onChange: (icon: ConfigurationIconReference) => void;
}

const describe = (icon: ConfigurationIconReference): string =>
    `${icon.library}/${icon.key}${icon.variant ? `:${icon.variant}` : ''}`;

/**
 * The icon field of one item. The host supplies the chooser through `renderIconField`; without one
 * the icon is shown as text, because choosing an icon needs the host's catalog.
 */
export const OrderedItemIconField = <TItem extends OrderedItem>({
    item,
    editable,
    itemName,
    labels,
    message,
    messageId,
    parts,
    renderIconField,
    isIconAvailable,
    onChange,
}: IconFieldProps<TItem>) => {
    const unavailable = item.icon !== undefined && isIconAvailable?.(item.icon) === false;
    const feedback = message ?? (unavailable ? labels.iconUnavailable : undefined);
    const accessibleName = `${labels.iconField}: ${itemName}`;

    return (
        <div
            {...parts?.icon}
            className={`cratis-ordered-item__icon ${parts?.icon?.className ?? ''}`}
            data-cratis-part='icon'
            data-control='icon'
            data-unavailable={unavailable || undefined}
        >
            {renderIconField ? (
                renderIconField({
                    item,
                    value: item.icon,
                    onChange,
                    readOnly: !editable,
                    'aria-label': accessibleName,
                    'aria-describedby': feedback ? messageId : undefined,
                    invalid: feedback !== undefined,
                    validationMessage: feedback,
                })
            ) : (
                <span className='cratis-ordered-item__text'>
                    <span className='cratis-ordered-item__hidden'>{accessibleName}: </span>
                    {item.icon ? describe(item.icon) : labels.noIcon}
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
