// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FilterPanel } from './FilterPanel';
import { Dialog } from '../Dialogs/Dialog';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import type { FilterDefinition } from './types';

// Both scenarios exercise FilterPanel within a slotted Dialog; declare the Dialog so
// the renderer matrix also runs these interactions against every Dialog adapter.
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

/** Exercise the browser's real fixed containing block, not jsdom's viewport-only geometry. */
export const TransformedOverlayContainer: Story = {
    name: 'Filter position in offset transformed overlay containers',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(document.body);
        const centeredAnchor = canvas.getByRole('button', { name: 'Centered filter trigger' });
        await userEvent.click(centeredAnchor);
        const centeredPanel = await body.findByRole('dialog', { name: 'Transformed filter choices' });
        await expect(centeredPanel.parentElement?.id).toBe('transformed-filter-overlays');
        await expect(getComputedStyle(centeredPanel.parentElement!).transform).not.toBe('none');
        await waitFor(() => expect(getComputedStyle(centeredPanel).opacity).toBe('1'), { timeout: 5000 });
        await waitFor(() => {
            const anchor = centeredAnchor.getBoundingClientRect();
            const panel = centeredPanel.getBoundingClientRect();
            expect(Math.abs(panel.left - anchor.left)).toBeLessThan(4);
            expect(Math.abs(panel.top - anchor.bottom - 8)).toBeLessThan(4);
            expect(panel.left).toBeGreaterThanOrEqual(16);
            expect(panel.right).toBeLessThanOrEqual(window.innerWidth - 16 + 1);
        }, { timeout: 5000 });
        centeredAnchor.style.left = '260px';
        window.dispatchEvent(new Event('resize'));
        await waitFor(() => expect(Math.abs(centeredPanel.getBoundingClientRect().left - centeredAnchor.getBoundingClientRect().left)).toBeLessThan(4));
        centeredAnchor.style.top = '200px';
        window.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(Math.abs(centeredPanel.getBoundingClientRect().top - centeredAnchor.getBoundingClientRect().bottom - 8)).toBeLessThan(4));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Transformed filter choices' })).toBeNull(), { timeout: 5000 });

        const edgeAnchor = canvas.getByRole('button', { name: 'Edge filter trigger' });
        await userEvent.click(edgeAnchor);
        const edgePanel = await body.findByRole('dialog', { name: 'Ancestor filter choices' });
        await expect(edgePanel.parentElement?.id).toBe('ancestor-filter-overlays');
        await expect(getComputedStyle(edgePanel.parentElement!).transform).toBe('none');
        await expect(getComputedStyle(edgePanel.parentElement!.parentElement!).transform).not.toBe('none');
        await waitFor(() => expect(getComputedStyle(edgePanel).opacity).toBe('1'), { timeout: 5000 });
        await waitFor(() => {
            const anchor = edgeAnchor.getBoundingClientRect();
            const panel = edgePanel.getBoundingClientRect();
            expect(Math.abs(panel.right - (window.innerWidth - 16))).toBeLessThan(4);
            expect(Math.abs(panel.bottom - (anchor.top - 8))).toBeLessThan(4);
            expect(panel.left).toBeGreaterThanOrEqual(15);
            expect(panel.top).toBeGreaterThanOrEqual(15);
            expect(panel.right).toBeLessThanOrEqual(window.innerWidth - 15);
            expect(panel.bottom).toBeLessThanOrEqual(window.innerHeight - 15);
        }, { timeout: 5000 });
    },
    render: () => {
        const centeredRef = useRef<HTMLButtonElement>(null);
        const edgeRef = useRef<HTMLButtonElement>(null);
        const [open, setOpen] = useState<'center' | 'edge' | null>(null);
        const common = {
            filters, filterValues: {}, rangeValues: {},
            onFilterToggle: () => undefined, onFilterClear: () => undefined,
            onRangeChange: () => undefined, onExpandedFilterChange: () => undefined,
        };
        return <CratisComponentsProvider overlayEnvironment={{
            getContainer: () => document.getElementById(open === 'edge' ? 'ancestor-filter-overlays' : 'transformed-filter-overlays'),
        }}>
            <button ref={centeredRef} onClick={() => setOpen('center')}
                style={{ position: 'fixed', top: 180, left: 240 }}>Centered filter trigger</button>
            <button ref={edgeRef} onClick={() => setOpen('edge')}
                style={{ position: 'fixed', bottom: 36, right: 24 }}>Edge filter trigger</button>
            <div id='transformed-filter-overlays'
                style={{ position: 'fixed', top: 100, left: 80, transform: 'translateZ(0)' }} />
            <div style={{ position: 'fixed', top: 90, left: 60, transform: 'translateZ(0) scale(1.25)' }}>
                <div style={{ position: 'relative', top: 10, left: 20 }} id='ancestor-filter-overlays' />
            </div>
            <FilterPanel {...common} isOpen={open === 'center'} anchorRef={centeredRef}
                aria-label='Transformed filter choices' onClose={() => setOpen(null)} />
            <FilterPanel {...common} isOpen={open === 'edge'} anchorRef={edgeRef}
                aria-label='Ancestor filter choices' onClose={() => setOpen(null)} />
        </CratisComponentsProvider>;
    },
};
