// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
  PivotStore,
  PivotIndexes,
  WorkerInMessage,
  WorkerOutMessage,
  Field,
} from './types';
import { buildIndexes, applyFilters, computeGrouping, sortIds } from './store';

let store: PivotStore | null = null;
let indexes: PivotIndexes | null = null;

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const message = e.data;
  console.log('[Worker] Received message:', message.type);

  switch (message.type) {
    case 'buildIndexes': {
      console.log('[Worker] Building indexes for', message.store.items.length, 'items');
      
      // Convert fields array back to Map
      const fieldsArray = message.store.fields as unknown as [string, Field][];
      const fieldsMap = new Map<string, Field>(fieldsArray);
      
      store = {
        ...message.store,
        fields: fieldsMap,
      };
      
      console.log('[Worker] Store converted, fields:', Array.from(fieldsMap.keys()));
      if (store) {
        indexes = buildIndexes(store, message.fields);
        console.log('[Worker] Indexes built');

        const response: WorkerOutMessage = {
          type: 'indexesReady',
          indexes,
        };
        console.log('[Worker] Posting indexesReady');
        self.postMessage(response);
      }
      break;
    }

    case 'applyFilters': {
      if (!store || !indexes) {
        console.error('Store or indexes not initialized');
        return;
      }

      const result = applyFilters(store, indexes, message.filters);

      const response: WorkerOutMessage = {
        type: 'filterResult',
        result,
      };
      self.postMessage(response);
      break;
    }

    case 'computeGrouping': {
      if (!store || !indexes) {
        console.error('[Worker] Store or indexes not initialized');
        return;
      }

      console.log('[Worker] Computing grouping for', message.visibleIds.length, 'items, groupBy:', message.groupBy);
      const result = computeGrouping(
        store,
        indexes,
        message.visibleIds,
        message.groupBy
      );
      console.log('[Worker] Grouping computed:', result.groups.length, 'groups');

      const response: WorkerOutMessage = {
        type: 'groupingResult',
        result,
      };
      console.log('[Worker] Posting groupingResult');
      self.postMessage(response);
      break;
    }

    case 'sort': {
      if (!store) {
        console.error('Store not initialized');
        return;
      }

      const result = sortIds(store, message.ids, message.sortBy);

      const response: WorkerOutMessage = {
        type: 'sortResult',
        result,
      };
      self.postMessage(response);
      break;
    }
  }
};

export {};
