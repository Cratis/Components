// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import { Dialog } from '../../Dialogs/Dialog';
import { FilterPanel } from '../FilterPanel';
import type { FilterDefinition } from '../types';

const filters: FilterDefinition[] = [{
    key: 'status', label: 'Status', searchable: true, autoFocus: true,
    options: [{ key: 'active', label: 'Active', value: 'active' }],
}];
const anchorRef = createRef<HTMLButtonElement>();
const onModalCancel = vi.fn();
const onPanelClose = vi.fn();
const noOp = () => undefined;
let host: HTMLDivElement;
let root: Root;
let overlayRoot: HTMLDivElement;

function Panel({ expandedFilterKey, initiallyOpen = true }: { expandedFilterKey?: string; initiallyOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(initiallyOpen);
    return <>
        <button ref={anchorRef} type='button' onClick={() => setIsOpen(true)}>Filters</button>
        <FilterPanel isOpen={isOpen} filters={filters} filterValues={{}} rangeValues={{}}
            anchorRef={anchorRef} expandedFilterKey={expandedFilterKey}
            search='' onSearchChange={noOp} onClose={() => { onPanelClose(); setIsOpen(false); }}
            onFilterToggle={noOp} onFilterClear={noOp} onRangeChange={noOp}
            onExpandedFilterChange={noOp} />
    </>;
}

const render = async (content: React.ReactNode, environment?: { getContainer(): HTMLElement | null }) => {
    await act(async () => root.render(
        <CratisComponentsProvider overlayEnvironment={environment}>{content}</CratisComponentsProvider>,
    ));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 400)); });
};
const panel = () => document.querySelector<HTMLElement>('.pv-filter-dropdown');
const openFromModal = async () => {
    await act(async () => anchorRef.current!.click());
};

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
    onModalCancel.mockReset();
    onPanelClose.mockReset();
    host = document.createElement('div');
    overlayRoot = document.createElement('div');
    document.body.append(host, overlayRoot);
    root = createRoot(host);
});

afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    overlayRoot.remove();
});

describe('when opening a filter panel without an overlay environment', () => {
    it('should portal directly to document.body', async () => {
        await render(<Panel />);
        expect(panel()?.parentElement).to.equal(document.body);
    });
});

describe('when the provider resolves a custom overlay container', () => {
    it('should portal into that container without changing its dialog markup', async () => {
        await render(<Panel />, { getContainer: () => overlayRoot });
        expect(panel()?.parentElement).to.equal(overlayRoot);
        expect(panel()?.getAttribute('role')).to.equal('dialog');
        expect(panel()?.getAttribute('aria-label')).to.equal('Filters');
        expect(panel()?.getAttribute('aria-modal')).to.equal(null);
    });
});

describe('when the configured container is temporarily unavailable', () => {
    it('should defer and mount on a later render when it becomes available, without falling back to body', async () => {
        let available = false;
        const environment = { getContainer: () => available ? overlayRoot : null };
        await render(<Panel />, environment);
        expect(panel()).to.equal(null);
        available = true;
        await render(<Panel />, environment);
        expect(panel()?.parentElement).to.equal(overlayRoot);
        expect(document.activeElement).to.equal(panel());
    });
});

describe('when a filter panel opens in a real modal Dialog with the default body container', () => {
    it('should stay in the modal rather than portal outside its focus scope', async () => {
        await render(<Dialog title='Edit filters' onCancel={onModalCancel}>
            <Panel initiallyOpen={false} />
        </Dialog>);
        await openFromModal();
        expect(panel()?.parentElement).to.equal(anchorRef.current?.closest('[data-cratis-part="root"]'));
        expect(document.activeElement).to.equal(panel());
        expect(panel()?.closest('[aria-hidden="true"], [inert]')).to.equal(null);
    });
});

describe('when a filter panel opens in a real modal Dialog with a shared overlay root', () => {
    it('should keep its search focused and exposed, then dismiss only the panel with Escape', async () => {
        await render(<Dialog title='Edit filters' onCancel={onModalCancel}>
            <Panel expandedFilterKey='status' initiallyOpen={false} />
        </Dialog>, { getContainer: () => overlayRoot });
        await openFromModal();
        const search = panel()?.querySelector<HTMLInputElement>('.pv-filter-group-search input');
        expect(search).not.to.equal(null);
        expect(panel()?.parentElement).to.equal(anchorRef.current?.closest('[data-cratis-part="root"]'));
        expect(document.activeElement).to.equal(search);
        expect(panel()?.closest('[aria-hidden="true"], [inert]')).to.equal(null);
        await act(async () => search!.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape', bubbles: true, cancelable: true,
        })));
        expect(onPanelClose.mock.calls.length).to.equal(1);
        expect(onModalCancel.mock.calls.length).to.equal(0);
        expect(document.activeElement).to.equal(anchorRef.current);
    });
});

describe('when the configured overlay container is inside a real modal Dialog', () => {
    it('should keep focus and accessibility in the modal, and dismiss only the panel', async () => {
        const environment = { getContainer: () => document.getElementById('modal-overlays') };
        await render(<Dialog title='Edit filters' onCancel={onModalCancel}>
            <div id='modal-overlays' />
            <CratisComponentsProvider overlayEnvironment={environment}>
                <Panel expandedFilterKey='status' initiallyOpen={false} />
            </CratisComponentsProvider>
        </Dialog>);
        await openFromModal();
        const search = panel()?.querySelector<HTMLInputElement>('.pv-filter-group-search input');
        expect(panel()?.parentElement?.id).to.equal('modal-overlays');
        expect(document.activeElement).to.equal(search);
        expect(panel()?.closest('[aria-hidden="true"], [inert]')).to.equal(null);
        await act(async () => search!.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape', bubbles: true, cancelable: true,
        })));
        expect(onPanelClose.mock.calls.length).to.equal(1);
        expect(onModalCancel.mock.calls.length).to.equal(0);
        expect(document.activeElement).to.equal(anchorRef.current);
    });
});
