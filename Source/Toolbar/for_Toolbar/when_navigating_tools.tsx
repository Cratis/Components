// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import { Toolbar } from '../Toolbar';
import { ToolbarFocusMode } from '../../Common/ToolbarFocusMode';

const key = async (target: Element, name: string, options: KeyboardEventInit = {}) => {
    let event!: KeyboardEvent;
    await act(async () => {
        event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options });
        target.dispatchEvent(event);
    });
    return event;
};

describe('when navigating Toolbar tools', () => {
    let container: HTMLDivElement;
    let root: Root;
    const buttons = () => Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    const toolbar = () => container.querySelector<HTMLElement>('[role="toolbar"]')!;
    const render = async (children: React.ReactNode, props: Partial<React.ComponentProps<typeof Toolbar>> = {}) => {
        await act(async () => root.render(<Toolbar {...props}>{children}</Toolbar>));
    };
    const tools = <><button>First</button><button>Second</button><button>Third</button></>;

    beforeEach(() => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should navigate vertically by default without changing Tab stops or wrapping', async () => {
        await render(tools);
        const [first, second, third] = buttons();
        first.focus();
        expect((await key(first, 'ArrowDown')).defaultPrevented).to.equal(true);
        expect(document.activeElement).to.equal(second);
        await key(second, 'ArrowUp');
        expect(document.activeElement).to.equal(first);
        expect((await key(first, 'ArrowUp')).defaultPrevented).to.equal(false);
        expect((await key(first, 'ArrowRight')).defaultPrevented).to.equal(false);
        expect(buttons().map(button => button.hasAttribute('tabindex'))).to.deep.equal([false, false, false]);
        third.focus();
        expect((await key(third, 'ArrowDown')).defaultPrevented).to.equal(false);
        expect(document.activeElement).to.equal(third);
    });

    it('should move exactly one tool and reach both ends inside a shadow root', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const shadowRoot = createRoot(shadow);
        try {
            await act(async () => shadowRoot.render(<Toolbar orientation='horizontal'>{tools}</Toolbar>));
            const [first, second, third] = shadow.querySelectorAll<HTMLButtonElement>('button');
            first.focus();
            expect(document.activeElement).to.equal(host);
            expect(shadow.activeElement).to.equal(first);
            expect((await key(first, 'ArrowRight')).defaultPrevented).to.equal(true);
            expect(shadow.activeElement).to.equal(second);
            expect((await key(second, 'End')).defaultPrevented).to.equal(true);
            expect(shadow.activeElement).to.equal(third);
            expect((await key(third, 'Home')).defaultPrevented).to.equal(true);
            expect(shadow.activeElement).to.equal(first);
        } finally {
            await act(async () => shadowRoot.unmount());
            host.remove();
        }
    });

    it('should navigate inside an application ancestor', async () => {
        await act(async () => root.render(<div role='application'><Toolbar><button>First</button><button>Second</button></Toolbar></div>));
        const [first, second] = buttons();
        first.focus();
        expect((await key(first, 'ArrowDown')).defaultPrevented).to.equal(true);
        expect(document.activeElement).to.equal(second);
    });

    it('should navigate inside a grid ancestor', async () => {
        await act(async () => root.render(<div role='grid'><Toolbar><button>First</button><button>Second</button></Toolbar></div>));
        const [first, second] = buttons();
        first.focus();
        expect((await key(first, 'ArrowDown')).defaultPrevented).to.equal(true);
        expect(document.activeElement).to.equal(second);
    });

    it('should leave widgets inside an application toolbar in control of their keys', async () => {
        await act(async () => root.render(<div role='application'><Toolbar><input aria-label='Text' /><div role='slider' tabIndex={0}>Slider</div><button>Last</button></Toolbar></div>));
        for (const target of container.querySelectorAll<HTMLElement>('input,[role="slider"]')) {
            target.focus();
            expect((await key(target, 'ArrowDown')).defaultPrevented).to.equal(false);
            expect(document.activeElement).to.equal(target);
        }
    });

    it('should navigate horizontally and reverse for an effective RTL direction', async () => {
        await render(tools, { orientation: 'horizontal' });
        const [first, second] = buttons();
        first.focus();
        await key(first, 'ArrowRight');
        expect(document.activeElement).to.equal(second);
        toolbar().setAttribute('dir', 'rtl');
        await key(second, 'ArrowRight');
        expect(document.activeElement).to.equal(first);
        await key(first, 'ArrowLeft');
        expect(document.activeElement).to.equal(second);
        await key(second, 'ArrowDown');
        expect(document.activeElement).to.equal(second);
    });

    it('should respect the computed direction even without a locale change', async () => {
        await render(tools, { orientation: 'horizontal', pt: { root: { style: { direction: 'rtl' } } } });
        const [first, second] = buttons();
        second.focus();
        await key(second, 'ArrowRight');
        expect(document.activeElement).to.equal(first);
    });

    it('should move to the first and last available tool with Home and End', async () => {
        await render(tools);
        const [first, second, third] = buttons();
        second.focus();
        await key(second, 'End');
        expect(document.activeElement).to.equal(third);
        await key(third, 'Home');
        expect(document.activeElement).to.equal(first);
    });

    it('should skip disabled, hidden and inert tools in DOM order', async () => {
        await render(<><button>First</button><div><button disabled>Disabled</button></div><div hidden><button>Hidden</button></div><div inert><button>Inert</button></div><button>Last</button></>);
        const [first, , , , last] = buttons();
        first.focus();
        await key(first, 'ArrowDown');
        expect(document.activeElement).to.equal(last);
    });

    it('should skip tools hidden by CSS or marked aria-disabled', async () => {
        await render(<><button>First</button><div style={{ display: 'none' }}><button>Hidden</button></div><button aria-disabled='true'>Unavailable</button><button>Last</button></>);
        const [first, , , last] = buttons();
        first.focus();
        await key(first, 'ArrowDown');
        expect(document.activeElement).to.equal(last);
    });

    it('should navigate from an aria-disabled tool in Arrows mode', async () => {
        await render(<><button>First</button><button aria-disabled='true'>Unavailable</button><button>Last</button></>);
        const [first, unavailable, last] = buttons();
        unavailable.focus();
        expect((await key(unavailable, 'ArrowDown')).defaultPrevented).to.equal(true);
        expect(document.activeElement).to.equal(last);
        unavailable.focus();
        expect((await key(unavailable, 'ArrowUp')).defaultPrevented).to.equal(true);
        expect(document.activeElement).to.equal(first);
        unavailable.focus();
        await key(unavailable, 'Home');
        expect(document.activeElement).to.equal(first);
        unavailable.focus();
        await key(unavailable, 'End');
        expect(document.activeElement).to.equal(last);
    });

    it('should leave editable, slider, select and custom widget keys alone', async () => {
        await render(<><button>First</button><input aria-label='Text' /><input type='range' /><select aria-label='Choice'><option>A</option></select><div role='combobox' tabIndex={0}>Combo</div><button>Last</button></>);
        for (const target of container.querySelectorAll<HTMLElement>('input,select,[role="combobox"]')) {
            target.focus();
            expect((await key(target, 'Home')).defaultPrevented).to.equal(false);
            expect((await key(target, 'ArrowDown')).defaultPrevented).to.equal(false);
            expect(document.activeElement).to.equal(target);
        }
        const first = buttons()[0];
        first.focus();
        expect((await key(first, 'ArrowDown', { shiftKey: true })).defaultPrevented).to.equal(false);
        expect((await key(first, 'ArrowDown', { isComposing: true })).defaultPrevented).to.equal(false);
    });

    it('should honor pt root handlers that prevent default or stop propagation', async () => {
        await render(tools, { pt: { root: { onKeyDown: event => event.preventDefault() } } });
        const first = buttons()[0];
        first.focus();
        await key(first, 'ArrowDown');
        expect(document.activeElement).to.equal(first);
        await render(tools, { pt: { root: { onKeyDown: event => event.stopPropagation() } } });
        await key(first, 'ArrowDown');
        expect(document.activeElement).to.equal(first);
    });

    it('should let a consumer tool handler cancel navigation', async () => {
        await render(<><button onKeyDown={event => event.preventDefault()}>First</button><button>Second</button></>);
        const first = buttons()[0];
        first.focus();
        await key(first, 'ArrowDown');
        expect(document.activeElement).to.equal(first);
    });

    it('should ignore events from a React portal outside its DOM', async () => {
        const portal = document.createElement('div');
        document.body.append(portal);
        try {
            await render(<><button>First</button>{createPortal(<button>Portal</button>, portal)}<button>Last</button></>);
            const target = portal.querySelector('button')!;
            target.focus();
            expect((await key(target, 'ArrowDown')).defaultPrevented).to.equal(false);
            expect(document.activeElement).to.equal(target);
        } finally {
            await act(async () => root.render(null));
            portal.remove();
        }
    });

    it('should keep nested horizontal and vertical toolbars independent', async () => {
        await render(<><button>Outer first</button><Toolbar orientation='horizontal'><button>Inner first</button><button>Inner last</button></Toolbar><button>Outer last</button></>);
        const [outerFirst, innerFirst, innerLast, outerLast] = buttons();
        innerFirst.focus();
        await key(innerFirst, 'ArrowRight');
        expect(document.activeElement).to.equal(innerLast);
        await key(innerLast, 'ArrowDown');
        expect(document.activeElement).to.equal(innerLast);
        outerFirst.focus();
        await key(outerFirst, 'ArrowDown');
        expect(document.activeElement).to.equal(outerLast);
    });

    it('should preserve all Tab stops and disable key handling in None mode', async () => {
        await render(tools, { focusMode: ToolbarFocusMode.None });
        const first = buttons()[0];
        first.focus();
        expect((await key(first, 'ArrowDown')).defaultPrevented).to.equal(false);
        expect(document.activeElement).to.equal(first);
        expect(buttons().every(button => !button.hasAttribute('tabindex'))).to.equal(true);
    });
});
