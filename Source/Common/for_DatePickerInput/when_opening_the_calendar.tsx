// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { should } from 'chai';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { within } from 'storybook/test';
import { DatePickerInput } from '../DatePickerInput';

should();

describe('when opening the calendar', () => {
    let container: HTMLDivElement;
    let root: Root;

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

    it('should expose the named trigger, popup relationship and expanded state', async () => {
        await act(async () => root.render(<DatePickerInput value={null} onChange={() => undefined} aria-label='Appointment date' />));
        const trigger = within(container).getByRole('button', { name: 'Open calendar Appointment date' });
        trigger.getAttribute('aria-haspopup')!.should.equal('dialog');
        trigger.getAttribute('aria-expanded')!.should.equal('false');
        trigger.querySelector('span')!.getAttribute('aria-hidden')!.should.equal('true');
        await act(async () => trigger.click());
        trigger.getAttribute('aria-expanded')!.should.equal('true');
        const popup = within(document.body).getByRole('dialog', { name: /Appointment date/ });
        trigger.getAttribute('aria-controls')!.should.equal(popup.id);
        await act(async () => popup.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
        trigger.getAttribute('aria-expanded')!.should.equal('false');
        should().not.exist(within(document.body).queryByRole('dialog'));
    });

    it('should preserve a caller-supplied dialog id and point the trigger at it', async () => {
        await act(async () => root.render(<DatePickerInput value={null} onChange={() => undefined} pt={{ dialog: { id: 'example-calendar-dialog' } }} />));
        const trigger = within(container).getByRole('button', { name: 'Open calendar Date' });
        await act(async () => trigger.click());
        const popup = within(document.body).getByRole('dialog');
        popup.id.should.equal('example-calendar-dialog');
        trigger.getAttribute('aria-controls')!.should.equal(popup.id);
    });

    it('should accept a localized trigger label', async () => {
        await act(async () => root.render(<DatePickerInput value={null} onChange={() => undefined} openCalendarLabel='Choose date' />));
        should().exist(within(container).getByRole('button', { name: 'Choose date Date' }));
    });
});
