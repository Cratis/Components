// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FilterPanel } from './FilterPanel';
import { Dialog } from '../Dialogs/Dialog';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import type { FilterDefinition } from './types';

// These stories use a slotted Dialog, so exercise every Dialog renderer adapter.
const meta: Meta<typeof Dialog> = { title: 'Filter/FilterPanel/In Dialog', component: Dialog };
export default meta;
type Story = StoryObj<typeof Dialog>;

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
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull(), { timeout: 5000 });
        await userEvent.click(body.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Edit filters' })).toBeNull(), { timeout: 5000 });
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

/** Probe an initially open dropdown while its side-sheet host is still sliding into place. */
export const SideDialogEntrance: Story = {
    name: 'Initially open filter in a sliding side dialog',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open side dialog' }));
        const body = within(document.body);
        const dialog = await body.findByRole('dialog', { name: 'Side filters' });
        const root = dialog.closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]')!;
        const anchor = body.getByRole('button', { name: 'Side filter trigger' });
        const panel = await body.findByRole('dialog', { name: 'Side filter choices' });
        await expect(panel.parentElement).toBe(root);
        if (root.hasAttribute('data-entering')) {
            await expect(getComputedStyle(root).overflow).toBe('hidden');
        }
        await waitFor(() => expect(root.hasAttribute('data-entering')).toBe(false), { timeout: 5000 });
        await waitFor(() => expect(Math.abs(panel.getBoundingClientRect().left - anchor.getBoundingClientRect().left)).toBeLessThan(4), { timeout: 5000 });
        const finalAnchor = anchor.getBoundingClientRect();
        const finalPanel = panel.getBoundingClientRect();
        const finalRoot = root.getBoundingClientRect();
        await expect(Math.abs(finalPanel.left - finalAnchor.left)).toBeLessThan(4);
        await expect(finalPanel.right).toBeGreaterThan(finalRoot.right + 80);
        await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'), { timeout: 5000 });
        // The overflowing portion must remain visible and clickable after the slide ends.
        const outsideRoot = document.elementFromPoint(finalRoot.right + 16, finalPanel.top + 20);
        await expect(panel.contains(outsideRoot)).toBe(true);
    },
    render: () => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const anchorRef = useRef<HTMLButtonElement>(null);
        return <CratisComponentsProvider overlayEnvironment={{ getContainer: () => document.getElementById('side-filter-overlays') }}>
            <button onClick={() => setDialogOpen(true)}>Open side dialog</button>
            <div id='side-filter-overlays' />
            {dialogOpen && <Dialog title='Side filters' placement='start' width='360px' onCancel={() => setDialogOpen(false)}>
                <div style={{ paddingLeft: 255, minHeight: 300 }}>
                    <button ref={anchorRef}>Side filter trigger</button>
                </div>
                <FilterPanel isOpen filters={filters} filterValues={{}} rangeValues={{}}
                    aria-label='Side filter choices' anchorRef={anchorRef}
                    onClose={() => undefined} onExpandedFilterChange={() => undefined}
                    onFilterToggle={() => undefined} onFilterClear={() => undefined}
                    onRangeChange={() => undefined} />
            </Dialog>}
        </CratisComponentsProvider>;
    },
};

/** Classic scrollbars do not turn a viewport-fixed dropdown into a root-clipped one. */
export const SideDialogWithClassicScrollbars: Story = {
    name: 'Side dialog filter extends past the root with classic scrollbars',
    play: async ({ canvasElement }) => {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        await expect(scrollbarWidth).toBeGreaterThan(0);
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open scrollable side dialog' }));
        const body = within(document.body);
        const root = (await body.findByRole('dialog', { name: 'Scrollable side filters' }))
            .closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]')!;
        await waitFor(() => expect(root.hasAttribute('data-entering')).toBe(false), { timeout: 5000 });
        await userEvent.click(body.getByRole('button', { name: 'Scrollbar filter trigger' }));
        const panel = await body.findByRole('dialog', { name: 'Scrollable side choices' });
        await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'), { timeout: 5000 });
        const clip = root.getBoundingClientRect();
        const bounds = panel.getBoundingClientRect();
        await expect(window.innerWidth - document.documentElement.clientWidth).toBeGreaterThan(0);
        await expect(bounds.width).toBeGreaterThan(300);
        await expect(bounds.right).toBeGreaterThan(clip.right + 80);
        await expect(panel.contains(document.elementFromPoint(clip.right + 16, bounds.top + 20))).toBe(true);
    },
    render: () => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [panelOpen, setPanelOpen] = useState(false);
        const anchorRef = useRef<HTMLButtonElement>(null);
        return <CratisComponentsProvider overlayEnvironment={{ getContainer: () => document.getElementById('scrollbar-filter-overlays') }}>
            <style>{'html { overflow-y: scroll !important; } html::-webkit-scrollbar { width: 15px; background: #ccc; }'}</style>
            <div style={{ minHeight: '200vh' }}>
                <button onClick={() => setDialogOpen(true)}>Open scrollable side dialog</button>
            </div>
            <div id='scrollbar-filter-overlays' />
            {dialogOpen && <Dialog title='Scrollable side filters' placement='start' width='360px' onCancel={() => setDialogOpen(false)}>
                <div style={{ paddingLeft: 255, minHeight: 300 }}>
                    <button ref={anchorRef} onClick={() => setPanelOpen(true)}>Scrollbar filter trigger</button>
                </div>
                <FilterPanel isOpen={panelOpen} filters={filters} filterValues={{}} rangeValues={{}}
                    aria-label='Scrollable side choices' anchorRef={anchorRef}
                    onClose={() => undefined} onExpandedFilterChange={() => undefined}
                    onFilterToggle={() => undefined} onFilterClear={() => undefined}
                    onRangeChange={() => undefined} />
            </Dialog>}
        </CratisComponentsProvider>;
    },
};

/** A positioner containing block is outside the root, so the root cannot clip its fixed child. */
export const TransformedPositioner: Story = {
    name: 'Filter stays full width outside a transformed positioner dialog root',
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open positioned dialog' }));
        const body = within(document.body);
        const root = (await body.findByRole('dialog', { name: 'Positioned filters' }))
            .closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]')!;
        await waitFor(() => expect(root.hasAttribute('data-entering')).toBe(false), { timeout: 5000 });
        await userEvent.click(body.getByRole('button', { name: 'Positioned filter trigger' }));
        const panel = await body.findByRole('dialog', { name: 'Positioned filter choices' });
        await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'), { timeout: 5000 });
        const clip = root.getBoundingClientRect();
        const bounds = panel.getBoundingClientRect();
        await expect(bounds.width).toBeGreaterThan(300);
        await expect(bounds.right).toBeGreaterThan(clip.right + 80);
        await expect(panel.contains(document.elementFromPoint(clip.right + 16, bounds.top + 20))).toBe(true);
    },
    render: () => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [panelOpen, setPanelOpen] = useState(false);
        const anchorRef = useRef<HTMLButtonElement>(null);
        return <CratisComponentsProvider overlayEnvironment={{ getContainer: () => document.getElementById('positioned-filter-overlays') }}>
            <button onClick={() => setDialogOpen(true)}>Open positioned dialog</button>
            <div id='positioned-filter-overlays' />
            {dialogOpen && <Dialog title='Positioned filters' placement='start' width='220px' onCancel={() => setDialogOpen(false)}
                pt={{ positioner: { style: { transform: 'translateZ(0)' } } }}>
                <div style={{ paddingLeft: 120, minHeight: 300 }}>
                    <button ref={anchorRef} onClick={() => setPanelOpen(true)}>Positioned filter trigger</button>
                </div>
                <FilterPanel isOpen={panelOpen} filters={filters} filterValues={{}} rangeValues={{}}
                    aria-label='Positioned filter choices' anchorRef={anchorRef}
                    onClose={() => undefined} onExpandedFilterChange={() => undefined}
                    onFilterToggle={() => undefined} onFilterClear={() => undefined}
                    onRangeChange={() => undefined} />
            </Dialog>}
        </CratisComponentsProvider>;
    },
};

/** A persistent fixed containing block must not clip a dropdown inside the modal root. */
export const PersistentContainingBlock: Story = {
    name: 'Filter options remain reachable in a transformed dialog',
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open clipped dialog' }));
        const body = within(document.body);
        const root = (await body.findByRole('dialog', { name: 'Clipped filters' }))
            .closest<HTMLElement>('.cratis-dialog[data-cratis-part="root"]')!;
        const panel = await body.findByRole('dialog', { name: 'Clipped filter choices' });
        await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'), { timeout: 5000 });
        const clip = root.getBoundingClientRect();
        const bounds = panel.getBoundingClientRect();
        // Chromium's fixed descendants are clipped by this transformed, overflow-hidden root.
        const overflow = {
            left: clip.left - bounds.left, right: bounds.right - clip.right,
            top: clip.top - bounds.top, bottom: bounds.bottom - clip.bottom,
        };
        if (Object.values(overflow).some((pixels) => pixels > 1)) {
            throw new Error(`Filter panel exceeds transformed Dialog clip rect: ${JSON.stringify(overflow)}`);
        }
        const scrollbox = panel.querySelector<HTMLElement>('.pv-filter-dropdown-content')!;
        await expect(scrollbox.scrollHeight).toBeGreaterThan(scrollbox.clientHeight);
        const last = body.getByRole('radio', { name: 'Option 19' });
        last.scrollIntoView({ block: 'center' });
        await expect(scrollbox.scrollTop).toBeGreaterThan(0);
        await userEvent.click(last);
        await expect(last).toBeChecked();
    },
    render: () => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [selected, setSelected] = useState<string | null>(null);
        const anchorRef = useRef<HTMLButtonElement>(null);
        const manyOptions: FilterDefinition[] = [{
            key: 'options', label: 'Options',
            options: Array.from({ length: 20 }, (_, index) => ({
                key: `option-${index}`, label: `Option ${index}`, value: `option-${index}`,
            })),
        }];
        return <CratisComponentsProvider overlayEnvironment={{ getContainer: () => document.getElementById('clipped-filter-overlays') }}>
            <button onClick={() => setDialogOpen(true)}>Open clipped dialog</button>
            <div id='clipped-filter-overlays' />
            {dialogOpen && <Dialog title='Clipped filters' width='360px' onCancel={() => setDialogOpen(false)}
                pt={{ root: { style: { height: 340, transform: 'translateZ(0)' } } }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', height: 190 }}>
                    <button ref={anchorRef}>Filter options</button>
                </div>
                <FilterPanel isOpen filters={manyOptions} filterValues={{ options: new Set(selected ? [selected] : []) }}
                    rangeValues={{}} expandedFilterKey='options' aria-label='Clipped filter choices'
                    anchorRef={anchorRef} onClose={() => undefined} onExpandedFilterChange={() => undefined}
                    onFilterToggle={(_key, option) => setSelected(option)} onFilterClear={() => setSelected(null)}
                    onRangeChange={() => undefined} />
            </Dialog>}
        </CratisComponentsProvider>;
    },
};
