// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DragEvent, ReactNode } from 'react';
import type { ConfigurationDestination } from './ConfigurationDestination';
import type { ConfigurationIconReference } from './ConfigurationIconReference';
import type { OrderedItem } from './OrderedItem';
import type { OrderedItemCapabilities } from './OrderedItemCapabilities';
import type { OrderedItemEditorParts } from './OrderedItemEditorParts';
import type { OrderedItemField } from './OrderedItemField';
import type { OrderedItemIconFieldProps } from './OrderedItemIconFieldProps';
import type { OrderedItemLabels } from './OrderedItemLabels';
import type { OrderedItemValidation } from './OrderedItemValidation';

/** Props of the internal row that renders one item of an {@link OrderedItemEditor}. */
export interface OrderedItemRowProps<TItem extends OrderedItem> {
    item: TItem;
    index: number;
    count: number;
    /** A locked item shows its values as text and offers no control. */
    locked: boolean;
    capabilities: OrderedItemCapabilities;
    labels: Required<OrderedItemLabels>;
    destinations: ReadonlyArray<ConfigurationDestination>;
    validation: OrderedItemValidation | undefined;
    baseId: string;
    parts: OrderedItemEditorParts | undefined;
    renderIconField?: (props: OrderedItemIconFieldProps<TItem>) => ReactNode;
    isIconAvailable?: (icon: ConfigurationIconReference) => boolean;
    dragging: boolean;
    dropPosition: 'before' | 'after' | undefined;
    onField: (item: TItem, field: OrderedItemField, value: string | ConfigurationIconReference | undefined) => void;
    onFieldBlur: (item: TItem, field: OrderedItemField) => void;
    onMove: (item: TItem, delta: -1 | 1, control: 'handle' | 'moveUp' | 'moveDown') => void;
    onRemove: (item: TItem) => void;
    onDragStart: (item: TItem, event: DragEvent<HTMLButtonElement>) => void;
    onDragOver: (item: TItem, event: DragEvent<HTMLLIElement>) => void;
    onDrop: (item: TItem, event: DragEvent<HTMLLIElement>) => void;
    onDragEnd: () => void;
}
