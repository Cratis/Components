// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { expect } from 'chai';
import { Toolbar } from '../Toolbar';

describe('when pressing arrow keys with modifiers on a tool', () => {
    let container: HTMLDivElement;
    let root: Root;

    const press = async (target: Element, name: string, options: KeyboardEventInit) => {
        let event!: KeyboardEvent;
        await act(async () => {
            event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...options });
            target.dispatchEvent(event);
        });
        return event;
    };

    beforeEach(async () => {
        (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => root.render(<Toolbar><button>First</button><button>Second</button></Toolbar>));
    });
    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'isComposing'] as const) {
        it(`should leave focus and the event alone for ${modifier}`, async () => {
            const [first] = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
            first.focus();
            const event = await press(first, 'ArrowDown', { [modifier]: true });
            expect(event.defaultPrevented).to.equal(false);
            expect(document.activeElement).to.equal(first);
        });
    }

    it('should move focus for the same key without a modifier', async () => {
        const [first, second] = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
        first.focus();
        const event = await press(first, 'ArrowDown', {});
        expect(event.defaultPrevented).to.equal(true);
        expect(document.activeElement).to.equal(second);
    });
});
