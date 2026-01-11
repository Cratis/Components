// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  PivotStore,
  PivotIndexes,
  FilterSpec,
  FilterResult,
  GroupSpec,
  GroupingResult,
  WorkerInMessage,
  WorkerOutMessage,
  FieldValue,
} from '../engine/types';
import { buildStore, buildIndexes, applyFilters, computeGrouping, sortIds } from '../engine/store';

export interface UsePivotEngineOptions<TItem extends object> {
  data: TItem[];
  fieldExtractors: Map<string, (item: TItem) => FieldValue>;
  indexFields: string[];
}

export interface UsePivotEngineResult {
  ready: boolean;
  applyFilters: (filters: FilterSpec[]) => Promise<FilterResult>;
  computeGrouping: (visibleIds: Uint32Array, groupBy: GroupSpec) => Promise<GroupingResult>;
  sortIds: (visibleIds: Uint32Array, sortBy: string) => Promise<Uint32Array>;
}

export function usePivotEngine<TItem extends object>({
  data,
  fieldExtractors,
  indexFields,
}: UsePivotEngineOptions<TItem>): UsePivotEngineResult {
  const [ready, setReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const indexesRef = useRef<PivotIndexes | null>(null);
  const fallbackRef = useRef(false);
  const storeRef = useRef<PivotStore | null>(null);
  const pendingCallbacksRef = useRef<Map<string, (result: unknown) => void>>(new Map());

  useEffect(() => {
    console.log('[PivotEngine] Creating worker');
    const worker = new Worker(
      new URL('../engine/pivot.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current = worker;
    console.log('[PivotEngine] Worker created, setting up message handlers');

    worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
      const message = e.data;
      console.log('[PivotEngine] Received message from worker:', message.type);

      switch (message.type) {
        case 'indexesReady':
          console.log('[PivotEngine] Indexes ready');
          setReady(true);
          break;

        case 'filterResult': {
          const callback = pendingCallbacksRef.current.get('filter');
          if (callback) {
            console.log('[PivotEngine] Calling filter callback and deleting');
            callback(message.result);
            pendingCallbacksRef.current.delete('filter');
          } else {
            console.warn('[PivotEngine] No callback registered for filter result - ignoring duplicate message');
          }
          break;
        }

        case 'groupingResult': {
          console.log('[PivotEngine] Received groupingResult:', message.result);
          const callback = pendingCallbacksRef.current.get('grouping');
          if (callback) {
            console.log('[PivotEngine] Calling grouping callback and deleting');
            callback(message.result);
            pendingCallbacksRef.current.delete('grouping');
          } else {
            console.warn('[PivotEngine] No callback registered for grouping result - ignoring duplicate message');
          }
          break;
        }

        case 'sortResult': {
          const callback = pendingCallbacksRef.current.get('sort');
          if (callback) {
            console.log('[PivotEngine] Calling sort callback and deleting');
            callback(message.result);
            pendingCallbacksRef.current.delete('sort');
          } else {
            console.warn('[PivotEngine] No callback registered for sort result - ignoring duplicate message');
          }
          break;
        }
      }
    };

    worker.onerror = (error) => {
      console.error('[PivotEngine] Worker error:', error);
      // enable synchronous fallback so UI can still function without worker
      fallbackRef.current = true;
      workerRef.current = null;
      // if we already built store/indexes, mark ready so UI can use fallback
      if (storeRef.current) {
        try {
          indexesRef.current = buildIndexes(storeRef.current, indexFields);
        } catch (e) {
          console.error('[PivotEngine] Failed to build indexes in fallback:', e);
          indexesRef.current = null;
        }
        setReady(true);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) {
      console.warn('[PivotEngine] Worker not available in data effect');
      return;
    }

    console.log('[PivotEngine] Building indexes for', data.length, 'items');
    setReady(false);

    const store = buildStore(data, fieldExtractors);
    storeRef.current = store;
    console.log('[PivotEngine] Store built with', store.items.length, 'items and', store.fields.size, 'fields');

    // compute indexes locally for immediate fallback and cache
    try {
      indexesRef.current = buildIndexes(store, indexFields);
    } catch (e) {
      console.error('[PivotEngine] buildIndexes failed:', e);
      indexesRef.current = null;
    }

    if (workerRef.current) {
      // Convert Map to array for serialization
      const fieldsArray = Array.from(store.fields.entries());
      const serializableStore = {
        ...store,
        fields: fieldsArray,
      };

      const message: WorkerInMessage = {
        type: 'buildIndexes',
        store: serializableStore as any,
        fields: indexFields,
      };

      console.log('[PivotEngine] Posting buildIndexes with', fieldsArray.length, 'fields');
      workerRef.current.postMessage(message);
    } else {
      // no worker available, mark ready to allow fallback synchronous usage
      setReady(true);
    }
  }, [data, fieldExtractors, indexFields]);

  const applyFiltersCallback = useCallback(
    (filters: FilterSpec[]): Promise<FilterResult> => {
      return new Promise((resolve) => {
        // If worker is not available, use synchronous fallback using local indexes
        if (!workerRef.current || fallbackRef.current) {
          try {
            const store = storeRef.current;
            const indexes = indexesRef.current;
            if (store && indexes) {
              const result = applyFilters(store, indexes, filters);
              resolve(result);
              return;
            }
          } catch (e) {
            console.error('[PivotEngine] fallback applyFilters error:', e);
          }

          // if fallback not possible, return empty result
          resolve({ visibleIds: new Uint32Array(0), count: 0 });
          return;
        }

        pendingCallbacksRef.current.set('filter', resolve as (result: unknown) => void);

        const message: WorkerInMessage = {
          type: 'applyFilters',
          filters,
        };

        workerRef.current.postMessage(message);
      });
    },
    [ready]
  );

  const computeGroupingCallback = useCallback(
    (visibleIds: Uint32Array, groupBy: GroupSpec): Promise<GroupingResult> => {
      console.log('[PivotEngine] computeGroupingCallback called with', visibleIds.length, 'visibleIds');
      
      // Check if there's already a pending grouping request
      if (pendingCallbacksRef.current.has('grouping')) {
        console.warn('[PivotEngine] Grouping already in progress, ignoring duplicate request');
        return Promise.resolve({ groups: [] });
      }
      
      return new Promise((resolve) => {
        // synchronous fallback if worker unavailable
        if (!workerRef.current || fallbackRef.current) {
          console.log('[PivotEngine] Using synchronous fallback for grouping');
          try {
            const store = storeRef.current;
            const indexes = indexesRef.current;
            if (store && indexes) {
              const result = computeGrouping(store, indexes, visibleIds, groupBy);
              console.log('[PivotEngine] Fallback grouping result:', result);
              resolve(result);
              return;
            }
          } catch (e) {
            console.error('[PivotEngine] fallback computeGrouping error:', e);
          }

          console.warn('[PivotEngine] No store/indexes for fallback, returning empty');
          resolve({ groups: [] });
          return;
        }

        console.log('[PivotEngine] Setting grouping callback and posting to worker');
        pendingCallbacksRef.current.set('grouping', resolve as (result: unknown) => void);

        const message: WorkerInMessage = {
          type: 'computeGrouping',
          visibleIds,
          groupBy,
        };

        workerRef.current.postMessage(message);
        console.log('[PivotEngine] Message posted to worker');
      });
    },
    [ready]
  );

  const sortIdsCallback = useCallback(
    (visibleIds: Uint32Array, sortBy: string): Promise<Uint32Array> => {
      return new Promise((resolve) => {
        // synchronous fallback if worker unavailable
        if (!workerRef.current || fallbackRef.current) {
          try {
            const store = storeRef.current;
            if (store) {
              const result = sortIds(store, visibleIds, sortBy);
              resolve(result);
              return;
            }
          } catch (e) {
            console.error('[PivotEngine] fallback sortIds error:', e);
          }

          resolve(visibleIds);
          return;
        }

        pendingCallbacksRef.current.set('sort', resolve as (result: unknown) => void);

        const message: WorkerInMessage = {
          type: 'sort',
          ids: visibleIds,
          sortBy,
        };

        workerRef.current.postMessage(message);
      });
    },
    [ready]
  );

  return {
    ready,
    applyFilters: applyFiltersCallback,
    computeGrouping: computeGroupingCallback,
    sortIds: sortIdsCallback,
  };
}
