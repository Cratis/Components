// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import { ActionMenubar, type ActionMenuItem } from '../ActionMenubar';
import { ToolbarFocusMode } from '../ToolbarFocusMode';

const model: ActionMenuItem[] = [{ label: 'First' }, { label: 'Second' }, { label: 'Last' }];

describe('when navigating ActionMenubar actions', () => {
    let container: HTMLDivElement;
    let root: Root;
    const buttons = () => Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    const render = async (items = model, focusMode?: ToolbarFocusMode, pt?: React.ComponentProps<typeof ActionMenubar>['pt']) => {
        await act(async () => root.render(<ActionMenubar model={items} focusMode={focusMode} pt={pt} />));
    };
    const key = async (target: Element, name: string) => {
        const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
        await act(async () => { target.dispatchEvent(event); });
        return event;
    };

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

    it('should navigate default horizontal arrows, Home and End without wrapping or changing Tab stops', async () => {
        await render();
        const [first, second, last] = buttons();
        first.focus();
        await key(first, 'ArrowRight');
        expect(document.activeElement).to.equal(second);
        await key(second, 'End');
        expect(document.activeElement).to.equal(last);
        expect((await key(last, 'ArrowRight')).defaultPrevented).to.equal(false);
        await key(last, 'Home');
        expect(document.activeElement).to.equal(first);
        expect(buttons().every(button => !button.hasAttribute('tabindex'))).to.equal(true);
    });

    it('should use effective RTL direction and skip disabled, inert and hidden actions', async () => {
        await render([
            { label: 'First' }, { label: 'Disabled', disabled: true },
            { template: () => <span hidden><button>Hidden</button></span> },
            { template: () => <span inert><button>Inert</button></span> },
            { label: 'Last' },
        ]);
        const [first, , , , last] = buttons();
        first.focus();
        await key(first, 'ArrowRight');
        expect(document.activeElement).to.equal(last);
        container.querySelector<HTMLElement>('[role="toolbar"]')!.setAttribute('dir', 'rtl');
        await key(last, 'ArrowRight');
        expect(document.activeElement).to.equal(first);
    });

    it('should allow pt and template consumer handlers to prevent navigation', async () => {
        await render(model, undefined, { root: { onKeyDown: event => event.preventDefault() } });
        buttons()[0].focus();
        await key(buttons()[0], 'ArrowRight');
        expect(document.activeElement).to.equal(buttons()[0]);
        await render([{ template: () => <button onKeyDown={event => event.preventDefault()}>First</button> }, { label: 'Second' }]);
        buttons()[0].focus();
        await key(buttons()[0], 'ArrowRight');
        expect(document.activeElement).to.equal(buttons()[0]);
    });

    it('should not take keys from editable template widgets or nested toolbars', async () => {
        await render([{ label: 'First' }, { template: () => <input aria-label='Edit' /> }, { template: () => <input type='range' /> }, { template: () => <select aria-label='Select'><option>A</option></select> }, { template: () => <div role='toolbar'><button>Nested</button></div> }, { label: 'Last' }]);
        for (const target of container.querySelectorAll<HTMLElement>('input,select')) {
            target.focus();
            expect((await key(target, 'ArrowRight')).defaultPrevented).to.equal(false);
            expect(document.activeElement).to.equal(target);
        }
        const nested = buttons()[1];
        nested.focus();
        await key(nested, 'ArrowRight');
        expect(document.activeElement).to.equal(nested);
    });

    it('should opt out to native behavior with None', async () => {
        await render(model, ToolbarFocusMode.None);
        buttons()[0].focus();
        expect((await key(buttons()[0], 'ArrowRight')).defaultPrevented).to.equal(false);
        expect(document.activeElement).to.equal(buttons()[0]);
        expect(buttons().every(button => !button.hasAttribute('tabindex'))).to.equal(true);
    });

    it('should offer one Tab stop and retain the last focused action in SingleTabStop', async () => {
        await render(model, ToolbarFocusMode.SingleTabStop);
        expect(buttons().map(button => button.tabIndex)).to.deep.equal([0, -1, -1]);
        buttons()[0].focus();
        await key(buttons()[0], 'ArrowRight');
        expect(buttons().map(button => button.tabIndex)).to.deep.equal([-1, 0, -1]);
        expect((await key(buttons()[1], 'Tab')).defaultPrevented).to.equal(false);
        buttons()[2].focus();
        expect(buttons().map(button => button.tabIndex)).to.deep.equal([-1, -1, 0]);
        await render(model.slice(0, 2), ToolbarFocusMode.SingleTabStop);
        await act(async () => { await Promise.resolve(); });
        expect(buttons().map(button => button.tabIndex)).to.deep.equal([0, -1]);
        await render([], ToolbarFocusMode.SingleTabStop);
        expect(buttons().length).to.equal(0);
        await render(model, ToolbarFocusMode.Arrows);
        expect(buttons().every(button => !button.hasAttribute('tabindex'))).to.equal(true);
    });
});
