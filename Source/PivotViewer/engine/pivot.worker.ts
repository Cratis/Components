// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
  PivotStore,
  PivotIndexes,
  WorkerInMessage,
  WorkerOutMessage,
} from './types';
import { buildIndexes, applyFilters, computeGrouping, sortIds } from './store';

let store: PivotStore | null = null;
let indexes: PivotIndexes | null = null;

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const message = e.data;

  switch (message.type) {
    case 'buildIndexes': {
      store = message.store;
      indexes = buildIndexes(store, message.fields);

      const response: WorkerOutMessage = {
        type: 'indexesReady',
        indexes,
      };
      self.postMessage(response);
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
        console.error('Store or indexes not initialized');
        return;
      }

      const result = computeGrouping(
        store,
        indexes,
        message.visibleIds,
        message.groupBy
      );

      const response: WorkerOutMessage = {
        type: 'groupingResult',
        result,
      };
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
