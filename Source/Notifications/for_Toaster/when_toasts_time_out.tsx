// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { toast } from '../toast';
import { type ToasterInTheDom, renderToaster, unmountToaster } from './given/a_toaster';

describe('when toasts time out', () => {
    let toaster: ToasterInTheDom;
    let timedOut: number;

    beforeEach(async () => {
        vi.useFakeTimers();
        timedOut = 0;
        toaster = await renderToaster({ timeout: 6000 });
    });

    afterEach(async () => {
        await unmountToaster(toaster);
        vi.useRealTimers();
    });

    const count = () => document.querySelectorAll('[data-cratis-part="toast"]').length;
    const toastElement = () => document.querySelector('[data-cratis-part="toast"]')!;
    const advance = (milliseconds: number) =>
        act(async () => {
            vi.advanceTimersByTime(milliseconds);
        });

    it('should dismiss after the default timeout and call onTimeout', async () => {
        await act(async () => {
            toast.info({ title: 'x', onTimeout: () => timedOut++ });
        });
        await advance(5999);
        expect(count()).to.equal(1);
        await advance(1);
        expect(count()).to.equal(0);
        expect(timedOut).to.equal(1);
    });

    it('should never time out below five seconds', async () => {
        await act(async () => {
            toast.info({ title: 'x', duration: 100 });
        });
        await advance(4999);
        expect(count()).to.equal(1);
        await advance(1);
        expect(count()).to.equal(0);
    });

    it('should not time out when the duration is zero', async () => {
        await act(async () => {
            toast.info({ title: 'x', duration: 0 });
        });
        await advance(60_000);
        expect(count()).to.equal(1);
    });

    it('should not time out while loading', async () => {
        await act(async () => {
            toast.info({ title: 'x', loading: true });
        });
        await advance(60_000);
        expect(count()).to.equal(1);
    });

    it('should pause while hovered and resume after leaving', async () => {
        await act(async () => {
            toast.info({ title: 'x' });
        });
        await act(async () => {
            toastElement().dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        });
        await advance(60_000);
        expect(count()).to.equal(1);
        await act(async () => {
            toastElement().dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        });
        await advance(6000);
        expect(count()).to.equal(0);
    });

    it('should pause while focused and resume once focus leaves', async () => {
        await act(async () => {
            toast.info({ title: 'x', action: { children: 'Undo' } });
        });
        const action = document.querySelector<HTMLButtonElement>('[data-cratis-part="action"]')!;
        await act(async () => {
            action.focus();
        });
        await advance(60_000);
        expect(count()).to.equal(1);
        await act(async () => {
            action.blur();
        });
        await advance(6000);
        expect(count()).to.equal(0);
    });
});
