// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Dialog } from '@cratis/components/Dialogs';
import { CratisComponentsProvider } from '@cratis/components/Common';
import { afterEach, describe, it } from 'vitest';
import { MuiTooltipSlot } from '../src/tooltip.js';

let mounted: { root: Root; host: HTMLElement } | undefined;

const mount = async (element: ReactElement, getContainer?: () => HTMLElement | null) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    mounted = { root, host };
    await act(async () =>
        root.render(
            getContainer ? (
                <CratisComponentsProvider overlayEnvironment={{ getContainer }}>
                    {element}
                </CratisComponentsProvider>
            ) : (
                element
            ),
        ),
    );
};

const focusTrigger = async (selector = '[data-cratis-tooltip-trigger]') => {
    const trigger = document.querySelector<HTMLElement>(selector);
    if (!trigger) throw new Error('Tooltip trigger not found.');
    await act(async () => trigger.focus());
    return trigger;
};

const popup = () => document.querySelector<HTMLElement>('[data-cratis-part="popup"]');
const resolveZIndex = (element: HTMLElement): number => {
    const substituted = element.style.zIndex.replace(/var\((--[^)]+)\)/gu, (_, name: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    );
    return (substituted.match(/-?\d+/gu) ?? []).reduce((total, term) => total + Number.parseInt(term, 10), 0);
};

const popper = () => popup()?.closest<HTMLElement>('[role="tooltip"]') ?? null;

afterEach(async () => {
    await act(async () => mounted?.root.unmount());
    mounted?.host.remove();
    mounted = undefined;
    document.body.innerHTML = '';
    document.documentElement.style.removeProperty('--cratis-z-index-dialog');
});

describe('when the MUI tooltip opens on a labelled trigger', () => {
    it('should describe the trigger without changing its accessible name', async () => {
        await mount(
            <MuiTooltipSlot content='Helpful text'>
                <button type='button' aria-label='Save'>Save</button>
            </MuiTooltipSlot>,
        );
        const trigger = await focusTrigger();
        expect(trigger.getAttribute('aria-label')).to.equal('Save');
        expect(trigger.hasAttribute('aria-labelledby')).to.equal(false);
                expect(trigger.getAttribute('aria-describedby')).to.equal(popper()?.id);
    });

    it('should not label the trigger from rich content either', async () => {
        await mount(
            <MuiTooltipSlot content={<strong>Rich</strong>}>
                <button type='button'>Save</button>
            </MuiTooltipSlot>,
        );
        const trigger = await focusTrigger();
        expect(trigger.hasAttribute('aria-label')).to.equal(false);
        expect(trigger.getAttribute('aria-describedby')).to.equal(popper()?.id);
    });
});

describe('when the MUI tooltip is inside a dialog opened from another dialog', () => {
    const stacked = (
        <>
            <Dialog title='First' visible buttons={null}>First</Dialog>
            <Dialog title='Second' visible buttons={null}>
                <MuiTooltipSlot content='Inside'>
                    <button type='button'>Inside</button>
                </MuiTooltipSlot>
            </Dialog>
        </>
    );

    const openAndMeasure = async () => {
        await mount(stacked);
        await focusTrigger();
        const backdrops = Array.from(
            document.querySelectorAll<HTMLElement>('.cratis-dialog__backdrop[data-cratis-part="backdrop"]'),
        );
        const second = backdrops[backdrops.length - 1] as HTMLElement;
        return { second: resolveZIndex(second), popper: resolveZIndex(popper() as HTMLElement) };
    };

    it('should stack the popup above the second dialog', async () => {
        document.documentElement.style.setProperty('--cratis-z-index-dialog', '1100');
        const { second, popper: popperZ } = await openAndMeasure();
        expect(popperZ).to.equal(second + 200);
    });

    it('should respect an overridden dialog token', async () => {
        document.documentElement.style.setProperty('--cratis-z-index-dialog', '10100');
        const { second, popper: popperZ } = await openAndMeasure();
        expect(second).to.be.greaterThan(10100);
        expect(popperZ).to.equal(second + 200);
    });
});

describe('when the MUI tooltip is outside a dialog', () => {
    it('should use the static tooltip token', async () => {
        await mount(
            <MuiTooltipSlot content='Plain'>
                <button type='button'>Plain</button>
            </MuiTooltipSlot>,
        );
        await focusTrigger();
        expect(popper()?.style.zIndex).to.equal('var(--cratis-z-index-tooltip)');
    });
});

describe('when the overlay container is null', () => {
    it('should defer the popup instead of mounting it in the body', async () => {
        await mount(
            <MuiTooltipSlot content='Deferred'>
                <button type='button'>Deferred</button>
            </MuiTooltipSlot>,
            () => null,
        );
        await focusTrigger();
        expect(popup()).to.equal(null);
    });
});
