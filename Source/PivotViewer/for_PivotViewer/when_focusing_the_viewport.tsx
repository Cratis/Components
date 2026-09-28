// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { PivotViewer } from '../PivotViewer';

const data: { category: string }[] = [];
const dimensions = [{ key: 'category', label: 'Category', getValue: (item: { category: string }) => item.category }];
let container: HTMLDivElement;
let root: Root;
let originalResizeObserver: typeof ResizeObserver;

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    originalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
        observe() { return undefined; }
        unobserve() { return undefined; }
        disconnect() { return undefined; }
    };
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    globalThis.ResizeObserver = originalResizeObserver;
});

const renderViewer = async (viewport?: string) => {
    await act(async () => root.render(
        <PivotViewer data={data} dimensions={dimensions} cardRenderer={() => ({ title: 'Sample item' })}
            labels={viewport ? { viewport } : undefined} />,
    ));
    return container.querySelector<HTMLDivElement>('.pv-viewport')!;
};

describe('when focusing the PivotViewer viewport', () => {
    it('should expose a named, keyboard-focusable region with the default English name', async () => {
        const viewport = await renderViewer();

        viewport.tabIndex.should.equal(0);
        viewport.getAttribute('role')!.should.equal('region');
        viewport.getAttribute('aria-label')!.should.equal('Card area');
        viewport.focus();
        expect(document.activeElement).to.equal(viewport);
    });

    it('should use the localized name without replacing the scroll element or its spacer', async () => {
        const viewport = await renderViewer();
        const spacer = viewport.firstElementChild;
        viewport.scrollTop = 25;
        const updated = await renderViewer('Kartenbereich');

        expect(updated).to.equal(viewport);
        expect(updated.firstElementChild).to.equal(spacer);
        updated.scrollTop.should.equal(25);
        updated.getAttribute('aria-label')!.should.equal('Kartenbereich');
        updated.tabIndex.should.equal(0);
    });
});
