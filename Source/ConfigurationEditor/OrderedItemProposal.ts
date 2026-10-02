// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { OrderedItem } from './OrderedItem';
import type { OrderedItemField } from './OrderedItemField';

/**
 * A change the person asked for, validated and permitted by the capabilities. The editor is
 * controlled: nothing changes until the host applies the proposal by passing new `items`. Every
 * proposal carries the `items` that would result, so accepting one is a single assignment.
 */
export type OrderedItemProposal<TItem extends OrderedItem = OrderedItem> =
    | {
          kind: 'add';
          /** The item the host created. */
          item: TItem;
          /** Where the item would be inserted. */
          index: number;
          /** The collection after the change. */
          items: ReadonlyArray<TItem>;
      }
    | {
          kind: 'remove';
          /** The item that would be removed. */
          item: TItem;
          /** Where the item was. */
          index: number;
          /** The collection after the change. */
          items: ReadonlyArray<TItem>;
      }
    | {
          kind: 'move';
          /** The item that would move. */
          item: TItem;
          /** Where the item was. */
          fromIndex: number;
          /** Where the item would be. */
          toIndex: number;
          /** The collection after the change. */
          items: ReadonlyArray<TItem>;
      }
    | {
          kind: 'update';
          /** The item as it would be after the change. */
          item: TItem;
          /** The item as it is now. */
          previous: TItem;
          /** The field that changed. */
          field: OrderedItemField;
          /** The collection after the change. */
          items: ReadonlyArray<TItem>;
      };
