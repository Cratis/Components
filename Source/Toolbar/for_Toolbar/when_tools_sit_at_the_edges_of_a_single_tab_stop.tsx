// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { expect } from 'chai';
import { Toolbar } from '../Toolbar';
import { ToolbarButton } from '../ToolbarButton';
import { ToolbarFanOutItem } from '../ToolbarFanOutItem';
import { ToolbarFolder } from '../ToolbarFolder';
import { ToolbarFocusMode } from '../../Common/ToolbarFocusMode';

let container: HTMLDivElement;
let portalTarget: HTMLDivElement;
let root: Root;
const render = async (element: React.ReactNode) => {
    await act(async () => root.render(element));
    // Registrations schedule one check per microtask.
    await act(async () => { await Promise.resolve(); });
};
const tabIndexOf = (label: string) => document.querySelector(`[aria-label="${label}"]`)!.getAttribute('tabindex');

beforeEach(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    portalTarget = document.createElement('div');
    document.body.append(container, portalTarget);
    root = createRoot(container);
});
afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    portalTarget.remove();
});

describe('when a tool is rendered through a portal', () => {
    it('should keep the portaled tool its native Tab stop and ignore its focus', async () => {
        await render(
            <Toolbar focusMode={ToolbarFocusMode.SingleTabStop}>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                <ToolbarButton icon='pi pi-eraser' title='Erase' />
                {createPortal(<ToolbarButton icon='pi pi-cog' title='Settings' />, portalTarget)}
            </Toolbar>,
        );
        expect(portalTarget.querySelector('[aria-label="Settings"]')!.getAttribute('tabindex')).to.not.equal('-1');
        await act(async () => portalTarget.querySelector<HTMLButtonElement>('[aria-label="Settings"]')!.focus());
        expect(tabIndexOf('Draw')).to.equal('0');
        expect(tabIndexOf('Erase')).to.equal('-1');
    });
});

describe('when a tool sits under a nested consumer toolbar', () => {
    it('should keep the nested tool its native Tab stop', async () => {
        await render(
            <Toolbar focusMode={ToolbarFocusMode.SingleTabStop}>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                <div role='toolbar' aria-label='Nested'>
                    <ToolbarButton icon='pi pi-cog' title='Settings' />
                </div>
            </Toolbar>,
        );
        expect(tabIndexOf('Draw')).to.equal('0');
        expect(tabIndexOf('Settings')).to.not.equal('-1');
    });
});

describe('when a nested toolbar uses the default mode', () => {
    it('should keep the inner tools their own Tab stops', async () => {
        await render(
            <Toolbar focusMode={ToolbarFocusMode.SingleTabStop}>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                <ToolbarButton icon='pi pi-eraser' title='Erase' />
                <Toolbar focusMode={ToolbarFocusMode.Arrows}>
                    <ToolbarButton icon='pi pi-circle' title='Circle' />
                    <ToolbarButton icon='pi pi-square' title='Square' />
                </Toolbar>
            </Toolbar>,
        );
        expect([tabIndexOf('Draw'), tabIndexOf('Erase')]).to.deep.equal(['0', '-1']);
        expect([tabIndexOf('Circle'), tabIndexOf('Square')]).to.deep.equal(['0', '0']);
    });
});

describe('when a toolbar has a fan-out item', () => {
    it('should make the fan-out trigger part of the single Tab stop', async () => {
        await render(
            <Toolbar focusMode={ToolbarFocusMode.SingleTabStop}>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                <ToolbarFanOutItem icon='pi pi-th-large' tooltip='Layouts'>
                    <ToolbarButton icon='pi pi-circle' title='Grid' />
                </ToolbarFanOutItem>
            </Toolbar>,
        );
        expect([tabIndexOf('Draw'), tabIndexOf('Layouts')]).to.deep.equal(['0', '-1']);
        await act(async () => document.querySelector<HTMLButtonElement>('[aria-label="Layouts"]')!.focus());
        expect([tabIndexOf('Draw'), tabIndexOf('Layouts')]).to.deep.equal(['-1', '0']);
    });
});

describe('when a folder trigger has an explicit tab index', () => {
    it('should keep that tab index and leave the other tools in the single Tab stop', async () => {
        await render(
            <Toolbar focusMode={ToolbarFocusMode.SingleTabStop}>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                <ToolbarButton icon='pi pi-eraser' title='Erase' />
                <ToolbarFolder icon='pi pi-folder' title='Shapes' pt={{ trigger: { tabIndex: 0 } }}>
                    <ToolbarButton icon='pi pi-circle' title='Circle' />
                </ToolbarFolder>
            </Toolbar>,
        );
        expect([tabIndexOf('Draw'), tabIndexOf('Erase'), tabIndexOf('Shapes')]).to.deep.equal(['0', '-1', '0']);
    });
});

describe('when switching from the default mode to a single Tab stop', () => {
    it('should give only the first tool the Tab stop', async () => {
        const tools = (focusMode: ToolbarFocusMode) => (
            <Toolbar focusMode={focusMode}>
                <ToolbarButton icon='pi pi-pencil' title='Draw' />
                <ToolbarButton icon='pi pi-eraser' title='Erase' />
            </Toolbar>
        );
        await render(tools(ToolbarFocusMode.Arrows));
        await render(tools(ToolbarFocusMode.SingleTabStop));
        expect([tabIndexOf('Draw'), tabIndexOf('Erase')]).to.deep.equal(['0', '-1']);
    });
});

describe('when a stylesheet alone hides the active tool', () => {
    it('should move the Tab stop once the tool is resized away', async () => {
        const resized: Array<() => void> = [];
        vi.stubGlobal('ResizeObserver', class {
            constructor(callback: () => void) { resized.push(callback); }
            observe() { /* The spec triggers resizes itself. */ }
            unobserve() { /* Nothing to release. */ }
            disconnect() { /* Nothing to release. */ }
        });
        const style = document.createElement('style');
        style.textContent = '.narrow [aria-label="Draw"] { display: none; }';
        document.head.append(style);
        try {
            await render(
                <Toolbar focusMode={ToolbarFocusMode.SingleTabStop}>
                    <ToolbarButton icon='pi pi-pencil' title='Draw' />
                    <ToolbarButton icon='pi pi-eraser' title='Erase' />
                </Toolbar>,
            );
            expect(tabIndexOf('Draw')).to.equal('0');
            document.body.classList.add('narrow');
            await act(async () => {
                resized.forEach(callback => callback());
                await Promise.resolve();
            });
            expect(tabIndexOf('Erase')).to.equal('0');
        } finally {
            document.body.classList.remove('narrow');
            style.remove();
            vi.unstubAllGlobals();
        }
    });
});

describe('when a tool re-renders inside its tooltip', () => {
    it('should not register the same element again', async () => {
        let observed = 0;
        vi.stubGlobal('ResizeObserver', class {
            observe() { observed++; }
            unobserve() { /* Nothing to release. */ }
            disconnect() { /* Nothing to release. */ }
        });
        let rerender: () => void = () => undefined;
        const Tools = () => {
            const [count, setCount] = useState(0);
            rerender = () => setCount(count + 1);
            return (
                <Toolbar focusMode={ToolbarFocusMode.SingleTabStop}>
                    <ToolbarButton icon='pi pi-pencil' title={`Draw ${count}`} />
                    <ToolbarButton icon='pi pi-eraser' title='Erase' />
                </Toolbar>
            );
        };
        try {
            await render(<Tools />);
            const initial = observed;
            for (let index = 0; index < 3; index++) {
                await act(async () => rerender());
                await act(async () => { await Promise.resolve(); });
            }
            expect(observed).to.equal(initial);
            expect([tabIndexOf('Draw 3'), tabIndexOf('Erase')]).to.deep.equal(['0', '-1']);
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
