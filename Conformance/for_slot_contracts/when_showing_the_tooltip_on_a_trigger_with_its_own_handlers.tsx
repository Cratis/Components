// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { atomicSlots } from './snippets/tooltip.js';

const Tooltip = atomicSlots['common.tooltip'].render;

describe('when showing the tooltip on a trigger with its own handlers', () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;
    let trigger: HTMLButtonElement;
    const calls: string[] = [];

    beforeEach(async () => {
        calls.length = 0;
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () =>
            root.render(
                <Tooltip content='Sample hint'>
                    <button
                        type='button'
                        aria-describedby='own-description'
                        onFocus={() => calls.push('focus')}
                        onBlur={() => calls.push('blur')}
                        onKeyDown={() => calls.push('keydown')}
                    >
                        Example action
                    </button>
                </Tooltip>,
            ),
        );
        trigger = container.querySelector<HTMLButtonElement>('button')!;
        await act(async () => trigger.focus());
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should call the trigger own focus handler', () => expect(calls).to.include('focus'));

    it('should show the popup', () => expect(container.querySelector('[role="tooltip"]')).to.not.equal(null));

    it('should keep the trigger own description and add the popup', () => {
        const popupId = container.querySelector('[role="tooltip"]')!.id;
        expect(trigger.getAttribute('aria-describedby')).to.equal(`own-description ${popupId}`);
    });

    describe('and Escape is pressed', () => {
        beforeEach(async () => {
            await act(async () => {
                trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            });
        });

        it('should call the trigger own key handler', () => expect(calls).to.include('keydown'));

        it('should hide the popup', () => expect(container.querySelector('[role="tooltip"]')).to.equal(null));
    });

    describe('and the trigger loses focus', () => {
        beforeEach(async () => {
            await act(async () => trigger.blur());
        });

        it('should call the trigger own blur handler', () => expect(calls).to.include('blur'));
    });
});
