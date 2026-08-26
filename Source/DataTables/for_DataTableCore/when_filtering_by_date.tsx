// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';
import { DataTableFilterMatchMode } from '../DataTableFilterMeta';

interface Appointment {
    id: number;
    scheduledAt: Date;
}

describe('when filtering by date', () => {
    let container: HTMLDivElement;
    let root: Root;
    const rowDate = new Date(2024, 4, 17, 13, 45, 30, 250);
    const filterDate = new Date(2024, 4, 17, 8, 0, 0, 0);
    const rowDateSnapshot = rowDate.getTime();
    const filterDateSnapshot = filterDate.getTime();

    const render = async (matchMode: string) => {
        await act(async () => {
            root.render(
                <DataTableCore<Appointment>
                    data={[
                        { id: 1, scheduledAt: rowDate },
                        { id: 2, scheduledAt: new Date(2024, 4, 18) },
                    ]}
                    dataKey='id'
                    emptyMessage='No appointments'
                    defaultFilters={{
                        scheduledAt: { value: filterDate, matchMode },
                    }}
                >
                    <Column<Appointment> field='scheduledAt' header='Scheduled' filter />
                </DataTableCore>,
            );
        });
    };

    beforeEach(async () => {
        // SAFETY: React's act() environment flag is untyped on globalThis.
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await render(DataTableFilterMatchMode.DateIs);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should never mutate the caller-owned row Date value', () => {
        expect(rowDate.getTime()).to.equal(rowDateSnapshot);
    });

    it('should never mutate the caller-owned filter constraint Date value', () => {
        expect(filterDate.getTime()).to.equal(filterDateSnapshot);
    });

    it('should match rows on the same calendar day regardless of time-of-day', () => {
        expect(
            container.querySelectorAll('[data-cratis-part="row"]'),
        ).to.have.length(1);
    });

    it('should not mutate Date values when comparing with dateBefore', async () => {
        await render(DataTableFilterMatchMode.DateBefore);
        expect(rowDate.getTime()).to.equal(rowDateSnapshot);
        expect(filterDate.getTime()).to.equal(filterDateSnapshot);
    });

    it('should not mutate Date values when comparing with dateAfter', async () => {
        await render(DataTableFilterMatchMode.DateAfter);
        expect(rowDate.getTime()).to.equal(rowDateSnapshot);
        expect(filterDate.getTime()).to.equal(filterDateSnapshot);
    });
});
