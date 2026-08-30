// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, it, vi } from 'vitest';
import { Button } from '../../Common/Button';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { DatePickerInput, type DatePickerInputProps } from '../../Common/DatePickerInput';
import { Tooltip, type TooltipProps } from '../../Common/Tooltip';
import {
    TablePaginator,
    type TablePaginatorProps,
} from '../../DataTables/TablePaginator';
import { Dialog, type DialogProps } from '../../Dialogs/Dialog';
import { Dropdown, type DropdownProps } from '../../Dropdown/Dropdown';
import {
    unstable_AdapterError,
    unstable_adapterErrorCodes,
    type unstable_SlotMap,
} from '..';
import { createTestLibrary } from '../for_resolution/testLibrary';

const atomicDeclaration = <Props extends object>(render: ComponentType<Props>) =>
    Object.freeze({ mode: 'atomic' as const, fidelity: 'native' as const, render });

const atomicControls = (
    <>
        <Tooltip content='Core tooltip'>
            <button type='button'>Tooltip trigger</button>
        </Tooltip>
        <Dropdown value='one' options={['one']} />
        <Dialog title='Core dialog' buttons={null}>
            Dialog content
        </Dialog>
        <DatePickerInput value={null} onChange={() => undefined} />
        <TablePaginator page={0} pageCount={2} onPageChange={() => undefined} />
    </>
);

describe('when routing atomic slots', () => {
    beforeEach(() => {
        (
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true;
    });

    it('should call every external atomic adapter once and render no Core atomic DOM', () => {
        const counts: Record<string, number> = {};
        const adapter = <Props extends object>(slotId: string) =>
            function AtomicAdapter(_props: Props) {
                counts[slotId] = (counts[slotId] ?? 0) + 1;
                return <div data-adapter-slot={slotId} />;
            };
        const slots: unstable_SlotMap = {
            'common.tooltip': atomicDeclaration(adapter<TooltipProps>('common.tooltip')),
            'dropdown.select': atomicDeclaration(
                adapter<DropdownProps<unknown>>('dropdown.select'),
            ),
            'dialogs.dialog': atomicDeclaration(adapter<DialogProps>('dialogs.dialog')),
            'display.datePicker': atomicDeclaration(
                adapter<DatePickerInputProps>('display.datePicker'),
            ),
            'datatables.paginator': atomicDeclaration(
                adapter<TablePaginatorProps>('datatables.paginator'),
            ),
        };
        const library = createTestLibrary('all-atomic-slots', slots);

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                {atomicControls}
            </CratisComponentsProvider>,
        );
        const container = document.createElement('div');
        container.innerHTML = html;

        expect(container.querySelectorAll('[data-adapter-slot]')).to.have.lengthOf(5);
        expect(container.querySelectorAll('[data-cratis-part]')).to.have.lengthOf(0);
        expect(Object.keys(counts)).to.have.lengthOf(5);
        expect(Object.values(counts)).to.deep.equal(Array(5).fill(1));
    });

    it('should leave callbacks, focus, dismissal, and scroll ownership solely with external adapters', async () => {
        const dropdownChange = vi.fn();
        const dialogCancel = vi.fn();
        const dateChange = vi.fn();
        const pageChange = vi.fn();
        const AdapterTooltip = () => <span data-adapter-tooltip />;
        const AdapterDropdown = ({ onChange }: DropdownProps<unknown>) => (
            <button
                type='button'
                data-adapter-dropdown
                onClick={() => onChange?.('adapter', { source: 'user' })}
            />
        );
        const AdapterDialog = ({ onCancel }: DialogProps) => (
            <button type='button' data-adapter-dialog onClick={() => void onCancel?.()} />
        );
        const AdapterDatePicker = ({ onChange }: DatePickerInputProps) => (
            <button
                type='button'
                data-adapter-date-picker
                onClick={() => onChange(new Date(2026, 0, 1), { source: 'user' })}
            />
        );
        const AdapterPaginator = ({ onPageChange }: TablePaginatorProps) => (
            <button
                type='button'
                data-adapter-paginator
                onClick={() => onPageChange(1)}
            />
        );
        const slots: unstable_SlotMap = {
            'common.tooltip': atomicDeclaration(AdapterTooltip),
            'dropdown.select': atomicDeclaration(AdapterDropdown),
            'dialogs.dialog': atomicDeclaration(AdapterDialog),
            'display.datePicker': atomicDeclaration(AdapterDatePicker),
            'datatables.paginator': atomicDeclaration(AdapterPaginator),
        };
        const library = createTestLibrary('interactive-atomic-slots', slots);
        const container = document.createElement('div');
        document.body.append(container);
        const root = createRoot(container);
        const originalOverflow = document.body.style.overflow;

        try {
            await act(async () => {
                root.render(
                    <CratisComponentsProvider library={library}>
                        <Tooltip content='External tooltip'>
                            <button type='button'>Ignored trigger</button>
                        </Tooltip>
                        <Dropdown onChange={dropdownChange} />
                        <Dialog title='External dialog' onCancel={dialogCancel}>
                            Ignored content
                        </Dialog>
                        <DatePickerInput value={null} onChange={dateChange} />
                        <TablePaginator
                            page={0}
                            pageCount={2}
                            onPageChange={pageChange}
                        />
                    </CratisComponentsProvider>,
                );
            });

            expect(container.querySelectorAll('[data-cratis-part]')).to.have.lengthOf(0);
            expect(
                document.querySelectorAll(
                    '[data-overlay-container], [data-react-aria-top-layer], [data-ismodal]',
                ),
            ).to.have.lengthOf(0);
            expect(document.body.style.overflow).to.equal(originalOverflow);

            await act(async () => {
                container
                    .querySelectorAll<HTMLButtonElement>('button')
                    .forEach((button) => button.click());
            });

            expect(dropdownChange.mock.calls).to.have.lengthOf(1);
            expect(dialogCancel.mock.calls).to.have.lengthOf(1);
            expect(dateChange.mock.calls).to.have.lengthOf(1);
            expect(pageChange.mock.calls).to.have.lengthOf(1);
            expect(document.body.style.overflow).to.equal(originalOverflow);
        } finally {
            await act(async () => root.unmount());
            container.remove();
        }
    });

    it('should compose Core Button with TooltipImplementation rather than the public Tooltip facade', () => {
        let externalTooltipCount = 0;
        const AdapterTooltip = () => {
            externalTooltipCount++;
            return <span data-adapter-tooltip />;
        };
        const slots: unstable_SlotMap = {
            'common.tooltip': atomicDeclaration(AdapterTooltip),
        };
        const library = createTestLibrary('external-tooltip', slots);

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                <Button label='Save' tooltip='Core button tooltip' />
            </CratisComponentsProvider>,
        );

        expect(externalTooltipCount).to.equal(0);
        expect(html).to.contain('cratis-tooltip-trigger');
        expect(html).to.contain('cratis-button');
    });

    it('should allow Core TablePaginatorImplementation to compose public Button slots', () => {
        let externalButtonCount = 0;
        const AdapterButton = () => {
            externalButtonCount++;
            return <button type='button' data-adapter-button />;
        };
        const slots: unstable_SlotMap = {
            'common.button': {
                mode: 'presentation',
                fidelity: 'native',
                render: AdapterButton,
            },
        };
        const library = createTestLibrary('external-paginator-buttons', slots);

        const html = renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                <TablePaginator page={0} pageCount={2} onPageChange={() => undefined} />
            </CratisComponentsProvider>,
        );

        expect(externalButtonCount).to.equal(4);
        expect(html.match(/data-adapter-button/g)).to.have.lengthOf(4);
        expect(html).not.to.contain('class="cratis-button"');
    });

    it('should not render nested Button slots when an external paginator owns the atomic slot', () => {
        let externalPaginatorCount = 0;
        let externalButtonCount = 0;
        const slots: unstable_SlotMap = {
            'common.button': {
                mode: 'presentation',
                fidelity: 'native',
                render: () => {
                    externalButtonCount++;
                    return <button type='button' data-adapter-button />;
                },
            },
            'datatables.paginator': atomicDeclaration(() => {
                externalPaginatorCount++;
                return <nav data-adapter-paginator />;
            }),
        };
        const library = createTestLibrary('external-paginator', slots);

        renderToStaticMarkup(
            <CratisComponentsProvider library={library}>
                <TablePaginator page={0} pageCount={2} onPageChange={() => undefined} />
            </CratisComponentsProvider>,
        );

        expect(externalPaginatorCount).to.equal(1);
        expect(externalButtonCount).to.equal(0);
    });

    it('should reject a facade-local atomic Core fallback at a throw terminal', () => {
        let error: unknown;

        try {
            renderToStaticMarkup(
                <CratisComponentsProvider rendererFallback='throw'>
                    <Tooltip content='Rejected fallback'>
                        <button type='button'>Trigger</button>
                    </Tooltip>
                </CratisComponentsProvider>,
            );
        } catch (caught: unknown) {
            error = caught;
        }

        expect(error).to.be.instanceOf(unstable_AdapterError);
        expect((error as unstable_AdapterError).code).to.equal(
            unstable_adapterErrorCodes.strictProfileFallback,
        );
        expect((error as unstable_AdapterError).diagnostic.slotId).to.equal(
            'common.tooltip',
        );
    });
});
