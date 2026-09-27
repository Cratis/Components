// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FilterPanel } from './FilterPanel';
import { Dialog } from '../Dialogs/Dialog';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import type { FilterDefinition } from './types';

const meta: Meta<typeof FilterPanel> = { title: 'Filter/FilterPanel/Accessibility', component: FilterPanel };
export default meta;
type Story = StoryObj<typeof FilterPanel>;

const filters: FilterDefinition[] = [{
    key: 'status', label: 'Status', searchable: true, autoFocus: true,
    searchAriaLabel: 'Find a status',
    options: [{ key: 'active', label: 'Active', value: 'active' }],
}];

export const FocusSearchAndDismiss: Story = {
    name: 'Focus search and dismiss inside and outside a modal',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);
        const standaloneTrigger = canvas.getAllByRole('button', { name: 'Filters' })
            .find((button) => button.hasAttribute('aria-expanded'))!;
        await userEvent.click(standaloneTrigger);
        await userEvent.click(body.getByRole('button', { name: 'Status' }));
        const search = body.getByRole('searchbox', { name: 'Find a status' });
        await expect(search).toHaveFocus();
        const panel = body.getByRole('dialog', { name: 'Filter choices' });
        await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'), { timeout: 5000 });
        await userEvent.keyboard('{Escape}');
        await expect(standaloneTrigger).toHaveFocus();
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull(), { timeout: 5000 });

        const mounts: { parent: Node; opacity: number }[] = [];
        const observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (node instanceof HTMLElement && node.matches('.pv-filter-dropdown')) {
                        mounts.push({ parent: record.target, opacity: Number(getComputedStyle(node).opacity) });
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        await userEvent.click(canvas.getByRole('button', { name: 'Edit filters' }));
        observer.disconnect();
        const modalTrigger = body.getAllByRole('button', { name: 'Filters' })
            .find((button) => !button.hasAttribute('aria-expanded'))!;
        const modalRoot = modalTrigger.closest('.cratis-dialog[data-cratis-part="root"]');
        await expect(mounts.length).toBeGreaterThan(0);
        await expect(mounts.every(({ parent }) => parent === modalRoot)).toBe(true);
        // The first frame starts transparent in the modal, then the enter transition completes.
        await expect(mounts[0].opacity).toBeLessThan(1);
        const modalPanel = await body.findByRole('dialog', { name: 'Filter choices' });
        await expect(modalPanel.parentElement).toHaveAttribute('data-cratis-part', 'root');
        await expect(modalPanel.closest('[aria-hidden="true"], [inert]')).toBeNull();
        await waitFor(() => expect(getComputedStyle(modalPanel).opacity).toBe('1'), { timeout: 5000 });
        await expect(modalRoot?.contains(document.activeElement)).toBe(true);
        await userEvent.click(body.getByRole('button', { name: 'Status' }));
        await expect(body.getByRole('searchbox', { name: 'Find a status' })).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await expect(modalTrigger).toHaveFocus();
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull(), { timeout: 5000 });
        await expect(body.getByRole('dialog', { name: 'Edit filters' })).toBeTruthy();
        await userEvent.click(modalTrigger);
        await expect((await body.findByRole('dialog', { name: 'Filter choices' })).parentElement).toBe(modalRoot);
    },
    render: () => {
        const anchorRef = useRef<HTMLButtonElement>(null);
        const modalAnchorRef = useRef<HTMLButtonElement>(null);
        const [isOpen, setIsOpen] = useState(false);
        const [modalOpen, setModalOpen] = useState(false);
        const [modalPanelOpen, setModalPanelOpen] = useState(false);
        const [modalGroup, setModalGroup] = useState<string | null>(null);
        const [expandedFilterKey, setExpandedFilterKey] = useState<string | null>(null);
        return <CratisComponentsProvider overlayEnvironment={{
            getContainer: () => document.getElementById('filter-story-overlays'),
        }}>
            <div style={{ padding: '3rem' }}>
                <button ref={anchorRef} aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>Filters</button>
                <button onClick={() => { setModalPanelOpen(true); setModalOpen(true); }}>Edit filters</button>
                <div id='filter-story-overlays' />
                <FilterPanel isOpen={isOpen} filters={filters} filterValues={{}} rangeValues={{}}
                    aria-label='Filter choices' anchorRef={anchorRef} expandedFilterKey={expandedFilterKey}
                    onClose={() => setIsOpen(false)} onExpandedFilterChange={setExpandedFilterKey}
                    onFilterToggle={() => undefined} onFilterClear={() => undefined}
                    onRangeChange={() => undefined} />
            </div>
            {modalOpen && <Dialog title='Edit filters' onCancel={() => setModalOpen(false)}>
                <button ref={modalAnchorRef} onClick={() => setModalPanelOpen(true)}>Filters</button>
                <FilterPanel isOpen={modalPanelOpen} filters={filters} filterValues={{}} rangeValues={{}}
                    aria-label='Filter choices' anchorRef={modalAnchorRef} expandedFilterKey={modalGroup}
                    onClose={() => setModalPanelOpen(false)} onExpandedFilterChange={setModalGroup}
                    onFilterToggle={() => undefined} onFilterClear={() => undefined}
                    onRangeChange={() => undefined} />
            </Dialog>}
        </CratisComponentsProvider>;
    },
};
