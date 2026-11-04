// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, vi } from 'vitest';

vi.mock('../Common/Tooltip', () => ({
    Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

import { Toolbar } from '../Toolbar/Toolbar';
import { ToolbarButton } from '../Toolbar/ToolbarButton';
import { ToolbarContext } from '../Toolbar/ToolbarContext';
import { ToolbarFanOutItem } from '../Toolbar/ToolbarFanOutItem';
import { ToolbarFolder } from '../Toolbar/ToolbarFolder';
import { ToolbarGroup } from '../Toolbar/ToolbarGroup';
import { ToolbarLayout } from '../Toolbar/ToolbarLayout';
import { ToolbarSection } from '../Toolbar/ToolbarSection';
import { ToolbarSeparator } from '../Toolbar/ToolbarSeparator';

const icon = <span aria-hidden='true'>T</span>;

const examples: Record<string, { element: React.ReactElement; root: string }> = {
    ToolbarButton: { element: <ToolbarButton icon={icon} title='Example' />, root: 'button' },
    ToolbarFanOutItem: {
        element: <ToolbarFanOutItem icon={icon} tooltip='Example'><span>Child</span></ToolbarFanOutItem>,
        root: 'div',
    },
    ToolbarFolder: {
        element: <ToolbarFolder icon={icon} title='Example'><span>Child</span></ToolbarFolder>,
        root: 'div',
    },
    ToolbarGroup: { element: <ToolbarGroup><span>Child</span></ToolbarGroup>, root: 'div' },
    ToolbarLayout: { element: <ToolbarLayout name='example'><span>Child</span></ToolbarLayout>, root: 'div' },
    ToolbarSection: {
        element: <ToolbarSection><ToolbarContext name='main'><span>Child</span></ToolbarContext></ToolbarSection>,
        root: 'div',
    },
    ToolbarSeparator: { element: <ToolbarSeparator />, root: 'div' },
};

describe('when rendering marked toolbar components', () => {
    // SAFETY: jsdom has no ResizeObserver; ToolbarLayout measures itself with one.
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
        observe() { /* no layout in jsdom */ }
        unobserve() { /* no layout in jsdom */ }
        disconnect() { /* no layout in jsdom */ }
    };

    const render = async (element: React.ReactElement) => {
        // SAFETY: React's test-environment flag is an intentionally undocumented global absent from DOM typings.
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        await act(async () => root.render(<Toolbar>{element}</Toolbar>));
        return { container, dispose: async () => { await act(async () => root.unmount()); container.remove(); } };
    };

    for (const [name, example] of Object.entries(examples)) {
        it(`should mark the ${name} root element with its component name`, async () => {
            const mounted = await render(example.element);
            const marked = mounted.container.querySelectorAll(`[data-cratis-component="${name}"]`);
            marked.length.should.equal(1);
            marked[0].tagName.toLowerCase().should.equal(example.root);
            await mounted.dispose();
        });
    }

    it('should mark the ToolbarButton tile when it renders inside a drawer folder', async () => {
        const mounted = await render(
            <ToolbarFolder icon={icon} title='Drawer' presentation='drawer'>
                <ToolbarButton icon={icon} title='Tile' />
            </ToolbarFolder>,
        );
        const trigger = mounted.container.querySelector<HTMLElement>('[data-cratis-part="toolbar-folder-trigger"]');
        await act(async () => trigger?.click());
        const marked = mounted.container.querySelectorAll('[data-cratis-component="ToolbarButton"]');
        marked.length.should.equal(1);
        marked[0].getAttribute('data-cratis-part')!.should.equal('toolbar-folder-tile');
        await mounted.dispose();
    });
});
