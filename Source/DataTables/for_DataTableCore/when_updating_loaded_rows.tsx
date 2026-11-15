// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Column } from '../Column';
import { DataTableCore } from '../DataTableCore';

interface SampleRow {
    id?: string | number | null;
    name: string;
}

const StatefulCell = ({ name, onMount }: { name: string; onMount: (name: string) => void }) => {
    const [count, setCount] = useState(0);
    useEffect(() => onMount(name), [name, onMount]);
    return (
        <button aria-label={`Edit ${name}`} onClick={() => setCount(count + 1)}>
            {name}: {count}
        </button>
    );
};

describe('when updating loaded rows', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onMount = vi.fn();
    const onSelectedItemsChange = vi.fn();

    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        onMount.mockReset();
        onSelectedItemsChange.mockReset();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.restoreAllMocks();
    });

    const render = async (data: SampleRow[], selectedItems?: SampleRow[]) => {
        await act(async () => {
            root.render(
                <DataTableCore
                    data={data}
                    dataKey='id'
                    emptyMessage='No rows'
                    selectionMode='multiple'
                    selectedItems={selectedItems}
                    onSelectedItemsChange={onSelectedItemsChange}
                >
                    <Column<SampleRow> selectionMode='multiple' />
                    <Column<SampleRow>
                        header='Name'
                        body={(row) => <StatefulCell name={row.name} onMount={onMount} />}
                    />
                </DataTableCore>,
            );
        });
    };
    const cell = () => container.querySelector<HTMLButtonElement>('[aria-label="Edit A"]')!;

    describe.each([
        ['prepending', [{ id: 'X', name: 'X' }, { id: 'A', name: 'A' }, { id: 'B', name: 'B' }]],
        ['reordering', [{ id: 'B', name: 'B' }, { id: 'A', name: 'A' }]],
    ] as const)('when %s uniquely keyed rows', (_, updated) => {
        let original: HTMLButtonElement;

        beforeEach(async () => {
            await render([{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }]);
            original = cell();
            original.focus();
            await act(async () => original.click());
            await render([...updated]);
        });

        it('should retain the cell DOM node', () => {
            (cell() === original).should.equal(true);
        });

        it('should retain focus', () => {
            (document.activeElement === original).should.equal(true);
        });

        it('should retain local cell state', () => {
            cell().textContent!.should.equal('A: 1');
        });

        it('should not mount the surviving cell again', () => {
            onMount.mock.calls.filter(([name]) => name === 'A').should.have.lengthOf(1);
        });
    });

    describe.each([
        ['duplicate', [{ id: 'same', name: 'A' }, { id: 'same', name: 'B' }]],
        ['missing', [{ name: 'A' }, { name: 'B' }]],
        ['null', [{ id: null, name: 'A' }, { id: null, name: 'B' }]],
        ['stringified', [{ id: 1, name: 'A' }, { id: '1', name: 'B' }]],
    ] as const)('when rows have %s keys', (_, data) => {
        beforeEach(async () => {
            await render([...data], [data[1]]);
        });

        it('should retain key-based multiple selection for both rows', () => {
            const checkboxes = container.querySelectorAll<HTMLInputElement>(
                '[data-cratis-part="cell"] input[type="checkbox"]',
            );
            Array.from(checkboxes, (checkbox) => checkbox.checked).should.deep.equal([true, true]);
        });

        it('should clear the selected identity when either row is toggled', async () => {
            const checkbox = container.querySelector<HTMLInputElement>(
                '[data-cratis-part="cell"] input[type="checkbox"]',
            )!;
            await act(async () => checkbox.click());
            onSelectedItemsChange.mock.calls[0][0].should.deep.equal([]);
        });
    });

    it('should render ambiguous and fallback-like identities without duplicate key warnings', async () => {
        const errors = vi.spyOn(console, 'error');
        const rows: SampleRow[] = [
            { id: 'same', name: 'A' },
            { id: 'same', name: 'B' },
            { name: 'Missing' },
            { id: null, name: 'Null' },
            { id: 'same::0', name: 'Suffix' },
            { id: 'loaded-row:2', name: 'Fallback' },
            { id: 'data-key:same', name: 'Prefix' },
        ];
        await render(rows);
        container.querySelectorAll('[data-cratis-part="row"]').length.should.equal(rows.length);
        errors.mock.calls.should.have.lengthOf(0);
    });
});
