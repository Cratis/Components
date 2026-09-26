// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { GroupingResult } from '../engine/types';
import type { PivotDimension, PivotGroup } from '../types';

/** Apply display-only dimension callbacks after results cross the worker boundary. */
export function presentGrouping<TItem extends object>(
    result: GroupingResult,
    dimension: PivotDimension<TItem> | undefined,
    data: TItem[],
): GroupingResult {
    if (!dimension?.formatValue && !dimension?.sort) return result;

    const groups = result.groups.map(group => ({
        ...group,
        label: dimension.formatValue ? dimension.formatValue(group.value) : group.label,
    }));

    if (dimension.sort) {
        const publicGroups = new Map(groups.map(group => [group, {
            key: group.key,
            label: group.label,
            value: group.value,
            items: Array.from(group.ids, id => data[id]),
            count: group.count,
        } satisfies PivotGroup<TItem>]));
        groups.sort((a, b) => dimension.sort!(publicGroups.get(a)!, publicGroups.get(b)!));
    }

    return { ...result, groups };
}
