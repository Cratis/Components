// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';
import { valueAtPath } from './valueAtPath';

export const useReconciledQuerySelection = <TData extends object>(
    rows: TData[],
    selection: TData | null | undefined,
    dataKey: string | undefined,
    ready: boolean,
    onSelectionChange: ((event: DataTableSelectionChangeEvent<TData>) => void) | undefined,
) => {
    const notified = useRef<{
        rows: TData[];
        selection: TData;
        dataKey: string | undefined;
    } | undefined>(undefined);

    useEffect(() => {
        if (!selection) notified.current = undefined;
        if (!ready || !selection || !onSelectionChange) return;
        // A controlled consumer may keep its value. Do not repeat the same proposal just
        // because its callback changed on an unrelated render.
        if (notified.current?.rows === rows && notified.current.selection === selection &&
            notified.current.dataKey === dataKey) return;
        notified.current = { rows, selection, dataKey };

        const identity = (row: TData) => String(valueAtPath(row as Record<string, unknown>, dataKey));
        const current = rows.includes(selection) ? selection : rows.find((row) =>
            dataKey ? identity(row) === identity(selection) : row === selection,
        ) ?? null;
        if (current !== selection) onSelectionChange({ value: current });
    }, [rows, selection, dataKey, ready, onSelectionChange]);
};
