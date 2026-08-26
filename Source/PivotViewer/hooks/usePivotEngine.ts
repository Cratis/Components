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
import {
    buildStore,
    buildIndexes,
    applyFilters,
    computeGrouping,
    sortIds,
} from '../engine/store';
import { createRequestCorrelator } from '../engine/requestCorrelator';

export interface UsePivotEngineOptions<TItem extends object> {
    data: TItem[];
    fieldExtractors: Map<string, (item: TItem) => FieldValue>;
    indexFields: string[];
}

export interface UsePivotEngineResult {
    ready: boolean;
    applyFilters: (filters: FilterSpec[]) => Promise<FilterResult>;
    computeGrouping: (
        visibleIds: Uint32Array,
        groupBy: GroupSpec,
    ) => Promise<GroupingResult>;
    sortIds: (visibleIds: Uint32Array, sortBy: string) => Promise<Uint32Array>;
}

export function usePivotEngine<TItem extends object>({
    data,
    fieldExtractors,
    indexFields,
}: UsePivotEngineOptions<TItem>): UsePivotEngineResult {
    const [ready, setReady] = useState(false);
    const [workerAvailable, setWorkerAvailable] = useState(false);
    const workerRef = useRef<Worker | null>(null);
    const indexesRef = useRef<PivotIndexes | null>(null);
    const fallbackRef = useRef(false);
    const storeRef = useRef<PivotStore | null>(null);
    // Every filter/grouping/sort request/response pair is correlated by a unique request id
    // (see createRequestCorrelator) so overlapping or out-of-order worker responses resolve
    // their own promise. groupingRequestIdRef separately tracks the in-flight grouping request,
    // preserving the intentional single-flight de-dup below (an overlapping grouping call
    // resolves immediately with an empty result instead of queuing behind the worker).
    const correlatorRef = useRef(createRequestCorrelator<unknown>());
    const groupingRequestIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof Worker === 'undefined') {
            fallbackRef.current = true;
            setWorkerAvailable(false);
            return;
        }

        const workerUrl = new URL('../engine/pivot.worker.js', import.meta.url);
        let disposed = false;

        const enableFallback = () => {
            fallbackRef.current = true;
            workerRef.current = null;
            setWorkerAvailable(false);
        };

        const setupWorker = async () => {
            try {
                if (typeof fetch === 'function') {
                    const response = await fetch(workerUrl, { method: 'HEAD' });
                    const contentType = response.headers.get('content-type') ?? '';

                    if (!response.ok || !contentType.includes('javascript')) {
                        enableFallback();
                        return;
                    }
                }
            } catch {
                enableFallback();
                return;
            }

            if (disposed) {
                return;
            }

            const worker = new Worker(workerUrl, { type: 'module' });

            workerRef.current = worker;
            setWorkerAvailable(true);

            worker.onmessage = (e: MessageEvent<WorkerOutMessage>) => {
                const message = e.data;

                switch (message.type) {
                    case 'indexesReady':
                        setReady(true);
                        break;

                    case 'filterResult': {
                        correlatorRef.current.resolve(message.requestId, message.result);
                        break;
                    }

                    case 'groupingResult': {
                        correlatorRef.current.resolve(message.requestId, message.result);
                        if (groupingRequestIdRef.current === message.requestId) {
                            groupingRequestIdRef.current = null;
                        }
                        break;
                    }

                    case 'sortResult': {
                        correlatorRef.current.resolve(message.requestId, message.result);
                        break;
                    }
                }
            };

            worker.onerror = (error) => {
                console.error('[PivotEngine] Worker error:', error);
                enableFallback();
                if (storeRef.current) {
                    try {
                        indexesRef.current = buildIndexes(storeRef.current, indexFields);
                    } catch (e) {
                        console.error(
                            '[PivotEngine] Failed to build indexes in fallback:',
                            e,
                        );
                        indexesRef.current = null;
                    }
                    setReady(true);
                }
            };
        };

        void setupWorker();

        return () => {
            disposed = true;
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, [indexFields]);

    useEffect(() => {
        setReady(false);

        const store = buildStore(data, fieldExtractors);
        storeRef.current = store;

        try {
            indexesRef.current = buildIndexes(store, indexFields);
        } catch (e) {
            console.error('[PivotEngine] buildIndexes failed:', e);
            indexesRef.current = null;
        }

        if (workerRef.current && !fallbackRef.current) {
            const fieldsArray = Array.from(store.fields.entries());
            const serializableStore = {
                ...store,
                fields: fieldsArray,
            };

            const message: WorkerInMessage = {
                type: 'buildIndexes',
                // SAFETY: serializableStore carries fields as a [string, Field][] tuple array (Map isn't
                // structured-clonable) which pivot.worker.ts converts back to a Map on receipt.
                store: serializableStore as unknown as PivotStore,
                fields: indexFields,
            };
            workerRef.current.postMessage(message);
        } else {
            setReady(true);
        }
    }, [data, fieldExtractors, indexFields, workerAvailable]);

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

                const requestId = correlatorRef.current.nextId();
                correlatorRef.current.register(
                    requestId,
                    resolve as (result: unknown) => void,
                );

                const message: WorkerInMessage = {
                    type: 'applyFilters',
                    requestId,
                    filters,
                };

                workerRef.current.postMessage(message);
            });
        },
        [ready],
    );

    const computeGroupingCallback = useCallback(
        (visibleIds: Uint32Array, groupBy: GroupSpec): Promise<GroupingResult> => {
            // Check if there's already a pending grouping request
            if (groupingRequestIdRef.current !== null) {
                return Promise.resolve({ groups: [] });
            }

            return new Promise((resolve) => {
                // synchronous fallback if worker unavailable
                if (!workerRef.current || fallbackRef.current) {
                    try {
                        const store = storeRef.current;
                        const indexes = indexesRef.current;
                        if (store && indexes) {
                            const result = computeGrouping(
                                store,
                                indexes,
                                visibleIds,
                                groupBy,
                            );
                            resolve(result);
                            return;
                        }
                    } catch (e) {
                        console.error('[PivotEngine] fallback computeGrouping error:', e);
                    }

                    resolve({ groups: [] });
                    return;
                }

                const requestId = correlatorRef.current.nextId();
                groupingRequestIdRef.current = requestId;
                correlatorRef.current.register(
                    requestId,
                    resolve as (result: unknown) => void,
                );

                const message: WorkerInMessage = {
                    type: 'computeGrouping',
                    requestId,
                    visibleIds,
                    groupBy,
                };

                workerRef.current.postMessage(message);
            });
        },
        [ready],
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

                const requestId = correlatorRef.current.nextId();
                correlatorRef.current.register(
                    requestId,
                    resolve as (result: unknown) => void,
                );

                const message: WorkerInMessage = {
                    type: 'sort',
                    requestId,
                    ids: visibleIds,
                    sortBy,
                };

                workerRef.current.postMessage(message);
            });
        },
        [ready],
    );

    return {
        ready,
        applyFilters: applyFiltersCallback,
        computeGrouping: computeGroupingCallback,
        sortIds: sortIdsCallback,
    };
}
