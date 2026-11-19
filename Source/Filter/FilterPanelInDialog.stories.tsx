// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { FilterPanel } from './FilterPanel';
import { Dialog, type DialogProps } from '../Dialogs/Dialog';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import type { FilterDefinition } from './types';

// These stories use a slotted Dialog, so exercise every Dialog renderer adapter. Stories that assert
// how FilterPanel joins the built-in shell itself (a .cratis-dialog root as the portal parent, its
// positioner part and slide entrance) carry the built-in-dialog-shell tag, so a renderer that
// implements dialogs.dialog skips them; see Storybook/scripts/lib/renderer-story-exclusions.mjs.
const meta: Meta<typeof Dialog> = { title: 'Filter/FilterPanel/In Dialog', component: Dialog };
export default meta;
type Story = StoryObj<typeof Dialog>;
const builtInDialogShell = ['built-in-dialog-shell'];

// Every dialog shell, built-in or adapter-rendered, marks its root with the dialog's id.
const dialogRoot = (dialog: HTMLElement) => dialog.closest<HTMLElement>('[data-cratis-dialog-id]')!;

// The built-in shell flags its slide with data-entering; an adapter shell may animate the root with
// CSS instead, which makes the root the fixed containing block until the animation ends.
const entranceSettled = async (root: HTMLElement) => {
    await waitFor(() => expect(root.hasAttribute('data-entering')).toBe(false), { timeout: 5000 });
    await Promise.all(root.getAnimations().map(async (animation) => animation.finished.catch(() => undefined)));
};

const filters: FilterDefinition[] = [{
    key: 'status', label: 'Status', searchable: true, autoFocus: true,
    searchAriaLabel: 'Find a status',
    options: [{ key: 'active', label: 'Active', value: 'active' }],
}];

interface SideDialogLabels {
    overlayId: string;
    openLabel: string;
    title: string;
    triggerLabel: string;
    choicesLabel: string;
}

interface SideFilterDialogProps extends SideDialogLabels {
    anchorInset: number;
    width: string;
    initiallyOpen?: boolean;
    pt?: DialogProps['pt'];
    page?: ReactNode;
    pageHeight?: string;
}

/** A start-placed dialog whose filter trigger sits near its end edge, so the panel overhangs the root. */
const SideFilterDialog = ({ overlayId, openLabel, title, triggerLabel, choicesLabel, anchorInset, width,
    initiallyOpen = false, pt, page, pageHeight }: SideFilterDialogProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [panelOpen, setPanelOpen] = useState(initiallyOpen);
    const anchorRef = useRef<HTMLButtonElement>(null);
    return <CratisComponentsProvider overlayEnvironment={{ getContainer: () => document.getElementById(overlayId) }}>
        {page}
        <div style={pageHeight ? { minHeight: pageHeight } : undefined}>
            <button onClick={() => setDialogOpen(true)}>{openLabel}</button>
        </div>
        <div id={overlayId} />
        {dialogOpen && <Dialog title={title} placement='start' width={width} onCancel={() => setDialogOpen(false)} pt={pt}>
            <div style={{ paddingLeft: anchorInset, minHeight: 300 }}>
                <button ref={anchorRef} onClick={() => setPanelOpen(true)}>{triggerLabel}</button>
            </div>
            <FilterPanel isOpen={panelOpen} filters={filters} filterValues={{}} rangeValues={{}}
                aria-label={choicesLabel} anchorRef={anchorRef}
                onClose={() => undefined} onExpandedFilterChange={() => undefined}
                onFilterToggle={() => undefined} onFilterClear={() => undefined}
                onRangeChange={() => undefined} />
        </Dialog>}
    </CratisComponentsProvider>;
};

const sideDialog: SideDialogLabels = {
    overlayId: 'side-filter-overlays', openLabel: 'Open side dialog', title: 'Side filters',
    triggerLabel: 'Side filter trigger', choicesLabel: 'Side filter choices',
};
const scrollableSideDialog: SideDialogLabels = {
    overlayId: 'scrollbar-filter-overlays', openLabel: 'Open scrollable side dialog', title: 'Scrollable side filters',
    triggerLabel: 'Scrollbar filter trigger', choicesLabel: 'Scrollable side choices',
};
const positionedDialog: SideDialogLabels = {
    overlayId: 'positioned-filter-overlays', openLabel: 'Open positioned dialog', title: 'Positioned filters',
    triggerLabel: 'Positioned filter trigger', choicesLabel: 'Positioned filter choices',
};

const SideDialog = () => <SideFilterDialog {...sideDialog} anchorInset={255} width='360px' initiallyOpen />;

/** Opens the panel once the dialog has settled and expects it to overhang the root, visible and hittable. */
const expectFilterExtendsPastRoot = async (canvasElement: HTMLElement, labels: SideDialogLabels) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: labels.openLabel }));
    const body = within(document.body);
    const root = dialogRoot(await body.findByRole('dialog', { name: labels.title }));
    await entranceSettled(root);
    await userEvent.click(body.getByRole('button', { name: labels.triggerLabel }));
    const panel = await body.findByRole('dialog', { name: labels.choicesLabel });
    await waitFor(() => expect(getComputedStyle(panel).opacity).toBe('1'), { timeout: 5000 });
    const clip = root.getBoundingClientRect();
    const bounds = panel.getBoundingClientRect();
    await expect(bounds.width).toBeGreaterThan(300);
    await expect(bounds.right).toBeGreaterThan(clip.right + 80);
    await expect(panel.contains(document.elementFromPoint(clip.right + 16, bounds.top + 20))).toBe(true);
};

/** A standalone filter panel beside an "Edit filters" modal that opens with its own panel open. */
const FocusFlow = () => {
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
};

// Records the parent of every filter panel mounted while the returned stop function has not run.
const observePanelMounts = () => {
    const mounts: { parent: Node; opacity: number }[] = [];
    const observer = new MutationObserver((records) => {
        for (const record of records) {
            const panels = [...record.addedNodes].filter((node): node is HTMLElement =>
                node instanceof HTMLElement && node.matches('.pv-filter-dropdown'));
            mounts.push(...panels.map((node) => ({ parent: record.target, opacity: Number(getComputedStyle(node).opacity) })));
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return { mounts, stop: () => observer.disconnect() };
};

const modalFilterTrigger = () => within(document.body).getAllByRole('button', { name: 'Filters' })
    .find((button) => !button.hasAttribute('aria-expanded'))!;

/** The built-in shell is the direct portal parent of every filter panel mounted in its modal. */
export const FocusSearchInBuiltInShell: Story = {
    name: 'Filter panels mount directly in the built-in modal root',
    tags: builtInDialogShell,
    play: async ({ canvasElement }) => {
        const body = within(document.body);
        const { mounts, stop } = observePanelMounts();
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Edit filters' }));
        stop();
        const modalTrigger = modalFilterTrigger();
        const modalRoot = modalTrigger.closest('.cratis-dialog[data-cratis-part="root"]');
        await expect(mounts.length).toBeGreaterThan(0);
        await expect(mounts.every(({ parent }) => parent === modalRoot)).toBe(true);
        const modalPanel = await body.findByRole('dialog', { name: 'Filter choices' });
        await expect(modalPanel.parentElement).toBe(modalRoot);
        await waitFor(() => expect(getComputedStyle(modalPanel).opacity).toBe('1'), { timeout: 5000 });
        await userEvent.click(body.getByRole('button', { name: 'Status' }));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull(), { timeout: 5000 });
        await userEvent.click(modalTrigger);
        await expect((await body.findByRole('dialog', { name: 'Filter choices' })).parentElement).toBe(modalRoot);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull(), { timeout: 5000 });
        await userEvent.click(body.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Edit filters' })).toBeNull(), { timeout: 5000 });
    },
    render: () => <FocusFlow />,
};

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

        const { mounts, stop } = observePanelMounts();
        await userEvent.click(canvas.getByRole('button', { name: 'Edit filters' }));
        stop();
        const modalTrigger = modalFilterTrigger();
        const modalRoot = dialogRoot(modalTrigger);
        await expect(mounts.length).toBeGreaterThan(0);
        await expect(mounts.every(({ parent }) => modalRoot.contains(parent))).toBe(true);
        // The first frame starts transparent in the modal, then the enter transition completes.
        await expect(mounts[0].opacity).toBeLessThan(1);
        const modalPanel = await body.findByRole('dialog', { name: 'Filter choices' });
        await expect(modalRoot.contains(modalPanel)).toBe(true);
        await expect(modalPanel.closest('[aria-hidden="true"], [inert]')).toBeNull();
        await waitFor(() => expect(getComputedStyle(modalPanel).opacity).toBe('1'), { timeout: 5000 });
        await expect(modalRoot.contains(document.activeElement)).toBe(true);
        await userEvent.click(body.getByRole('button', { name: 'Status' }));
        await expect(body.getByRole('searchbox', { name: 'Find a status' })).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await expect(modalTrigger).toHaveFocus();
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull(), { timeout: 5000 });
        await expect(body.getByRole('dialog', { name: 'Edit filters' })).toBeTruthy();
        await userEvent.click(modalTrigger);
        await expect(modalRoot.contains(await body.findByRole('dialog', { name: 'Filter choices' }))).toBe(true);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Filter choices' })).toBeNull(), { timeout: 5000 });
        await expect(body.getByRole('dialog', { name: 'Edit filters' })).toBeTruthy();
        await userEvent.click(body.getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(body.queryByRole('dialog', { name: 'Edit filters' })).toBeNull(), { timeout: 5000 });
    },
    render: () => <FocusFlow />,
};

/** The built-in side sheet hosts an initially open dropdown directly, clipped while it slides in. */
export const SideDialogEntranceInBuiltInShell: Story = {
    name: 'Initially open filter joins the sliding built-in side dialog root',
    tags: builtInDialogShell,
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open side dialog' }));
        const body = within(document.body);
        const root = dialogRoot(await body.findByRole('dialog', { name: 'Side filters' }));
        const panel = await body.findByRole('dialog', { name: 'Side filter choices' });
        await expect(root).toHaveClass('cratis-dialog');
        await expect(panel.parentElement).toBe(root);
        if (root.hasAttribute('data-entering')) {
            await expect(getComputedStyle(root).overflow).toBe('hidden');
        }
        await waitFor(() => expect(root.hasAttribute('data-entering')).toBe(false), { timeout: 5000 });
    },
    render: () => <SideDialog />,
};

/** Probe an initially open dropdown while its side-sheet host is still sliding into place. */
export const SideDialogEntrance: Story = {
    name: 'Initially open filter in a sliding side dialog',
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Open side dialog' }));
        const body = within(document.body);
        const root = dialogRoot(await body.findByRole('dialog', { name: 'Side filters' }));
        const anchor = body.getByRole('button', { name: 'Side filter trigger' });
        const panel = await body.findByRole('dialog', { name: 'Side filter choices' });
        await expect(root.contains(panel)).toBe(true);
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
    render: () => <SideDialog />,
};

/** A scrollable page does not turn a viewport-fixed dropdown into a root-clipped one. */
export const SideDialogWithClassicScrollbars: Story = {
    name: 'Side dialog filter extends past the root on a scrollable page',
    play: async ({ canvasElement }) => expectFilterExtendsPastRoot(canvasElement, scrollableSideDialog),
    render: () => <SideFilterDialog {...scrollableSideDialog} anchorInset={255} width='360px'
        page={<style>{'html { overflow-y: scroll !important; } html::-webkit-scrollbar { width: 15px; background: #ccc; }'}</style>}
        pageHeight='200vh' />,
};

/** A positioner containing block is outside the root, so the root cannot clip its fixed child. */
export const TransformedPositioner: Story = {
    name: 'Filter stays full width outside a transformed positioner dialog root',
    // Transforms the built-in positioner part, which an adapter's native modal does not render.
    tags: builtInDialogShell,
    play: async ({ canvasElement }) => expectFilterExtendsPastRoot(canvasElement, positionedDialog),
    render: () => <SideFilterDialog {...positionedDialog} anchorInset={120} width='220px'
        pt={{ positioner: { style: { transform: 'translateZ(0)' } } }} />,
};

/** A persistent fixed containing block must not clip a dropdown inside the modal root. */
export const PersistentContainingBlock: Story = {
    name: 'Filter options remain reachable in a transformed dialog',
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open clipped dialog' }));
        const body = within(document.body);
        const root = dialogRoot(await body.findByRole('dialog', { name: 'Clipped filters' }));
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
