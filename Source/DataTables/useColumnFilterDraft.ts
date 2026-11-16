// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useState, type SyntheticEvent } from 'react';
import type { ColumnFilterDataType } from './ColumnFilterMenu';
import { defaultModeFor } from './columnFilterMatchModes';
import type {
    DataTableFilterConstraint,
    DataTableFilterMatchMode as FilterMatchMode,
} from './DataTableFilterMeta';

/** Holds the draft value and match mode of a column filter and the apply/clear actions over it. */
export const useColumnFilterDraft = (
    dataType: ColumnFilterDataType,
    constraint: DataTableFilterConstraint | undefined,
    onApply: (constraint: DataTableFilterConstraint) => void,
    onClear: () => void,
) => {
    const [draftValue, setDraftValue] = useState<unknown>(constraint?.value ?? null);
    const [draftMode, setDraftMode] = useState<FilterMatchMode>(
        constraint?.matchMode ?? defaultModeFor(dataType),
    );

    useEffect(() => {
        setDraftValue(constraint?.value ?? null);
        setDraftMode(constraint?.matchMode ?? defaultModeFor(dataType));
    }, [constraint, dataType]);

    const clear = (event?: SyntheticEvent) => {
        setDraftValue(null);
        onClear();
        event?.preventDefault();
    };
    const apply = (event?: SyntheticEvent) => {
        onApply({ value: draftValue, matchMode: draftMode });
        event?.preventDefault();
    };

    return { draftValue, draftMode, setDraftValue, setDraftMode, apply, clear };
};
