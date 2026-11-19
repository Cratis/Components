// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { atomicSlots } from './snippets/datePicker.js';

const DatePicker = atomicSlots['display.datePicker'].render;

describe('when dismissing the date picker from Today', () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;
    let trigger: HTMLButtonElement;

    beforeEach(async () => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        await act(async () => root.render(<DatePicker value={null} onChange={() => undefined} />));
        trigger = container.querySelector<HTMLButtonElement>('[data-cratis-part="trigger"]')!;
        await act(async () => trigger.click());
        const today = container.querySelector<HTMLButtonElement>('[data-cratis-part="today"]')!;
        today.focus();
        expect(document.activeElement).to.equal(today);

        await act(async () => {
            today.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should remove the calendar', () => {
        expect(container.querySelectorAll('[data-cratis-part="calendar"]').length).to.equal(0);
    });

    it('should return focus to the trigger', () => {
        expect(document.activeElement).to.equal(trigger);
    });
});
