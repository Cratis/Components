// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { valueAtPath } from './valueAtPath';

export const dataTableRowKeys = <TData extends object>(data: TData[], dataKey?: string): string[] => {
    const values = data.map((row) =>
        dataKey ? valueAtPath(row as Record<string, unknown>, dataKey) : undefined,
    );
    const identities = values.map(String);
    const counts = new Map<string, number>();
    for (const identity of identities) {
        counts.set(identity, (counts.get(identity) ?? 0) + 1);
    }
    return identities.map((identity, loadedIndex) =>
        values[loadedIndex] != null && counts.get(identity) === 1
            ? `identity:${identity}`
            : `loaded-index:${loadedIndex}`,
    );
};
