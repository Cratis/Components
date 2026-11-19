// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
    const render = async (next: ReactElement = element) =>
        act(async () =>
            root.render(
                getContainer ? (
                    <CratisComponentsProvider overlayEnvironment={{ getContainer }}>
                        {next}
                    </CratisComponentsProvider>
                ) : (
                    next
                ),
            ),
        );
    await render();
    return render;
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

const tooltipTrigger = (label: string) => (
    <MuiTooltipSlot content={label}>
        <button type='button'>{label}</button>
    </MuiTooltipSlot>
);

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

describe('when the MUI tooltip is outside a dialog', () => {
    it('should use the static tooltip token', async () => {
        await mount(tooltipTrigger('Plain'));
        await focusTrigger();
        expect(popper()?.style.zIndex).to.equal('var(--cratis-z-index-tooltip)');
    });
});

describe('when the overlay container is null', () => {
    it('should defer the popup instead of mounting it in the body', async () => {
        await mount(tooltipTrigger('Deferred'), () => null);
        await focusTrigger();
        expect(popup()).to.equal(null);
    });
});

describe('when the MUI tooltip is inside a dialog', () => {
    const inDialog = (visible: boolean) => (
        <Dialog title='Host' visible={visible} buttons={null}>
            {tooltipTrigger('Inside')}
        </Dialog>
    );

    it('should stack the popup above the dialog', async () => {
        document.documentElement.style.setProperty('--cratis-z-index-dialog', '1100');
        await mount(inDialog(true));
        await focusTrigger();
        const backdrop = document.querySelector<HTMLElement>('.cratis-dialog__backdrop[data-cratis-part="backdrop"]');
        expect(resolveZIndex(popper() as HTMLElement)).to.equal(resolveZIndex(backdrop as HTMLElement) + 200);
    });

    it('should remove the popup immediately when the dialog closes while it is open', async () => {
        const render = await mount(inDialog(true));
        await focusTrigger();
        expect(popper()).to.not.equal(null);
        await render(inDialog(false));
        expect(popper()).to.equal(null);
        expect(document.body.querySelector(':scope > [role="tooltip"]')).to.equal(null);
    });

    it('should remove the popup when the dialog unmounts while it is open', async () => {
        const render = await mount(inDialog(true));
        await focusTrigger();
        expect(popper()).to.not.equal(null);
        await render(<div />);
        expect(popper()).to.equal(null);
    });

    it('should not show the old tooltip when the dialog opens again', async () => {
        const render = await mount(inDialog(true));
        await focusTrigger();
        await render(inDialog(false));
        await render(inDialog(true));
        expect(popper()).to.equal(null);
    });
});

describe('when the MUI tooltip is inside a dialog opened from another dialog', () => {
    const stacked = (
        <>
            <Dialog title='First' visible buttons={null}>First</Dialog>
            <Dialog title='Second' visible buttons={null}>{tooltipTrigger('Inside')}</Dialog>
        </>
    );

    it('should stack the popup above the second dialog', async () => {
        document.documentElement.style.setProperty('--cratis-z-index-dialog', '1100');
        await mount(stacked);
        await focusTrigger();
        const backdrops = Array.from(
            document.querySelectorAll<HTMLElement>('.cratis-dialog__backdrop[data-cratis-part="backdrop"]'),
        );
        const second = backdrops[backdrops.length - 1] as HTMLElement;
        expect(resolveZIndex(popper() as HTMLElement)).to.equal(resolveZIndex(second) + 200);
    });

    it('should respect an overridden dialog token', async () => {
        document.documentElement.style.setProperty('--cratis-z-index-dialog', '10100');
        await mount(stacked);
        await focusTrigger();
        expect(resolveZIndex(popper() as HTMLElement)).to.be.greaterThan(10100);
    });
});

describe('when the overlay environment changes during the exit transition', () => {
    let overlayHost: HTMLElement | null;
    let firstHost: HTMLElement;

    const openInHost = async (element: ReactElement = tooltipTrigger('Hosted')) => {
        firstHost = document.createElement('div');
        overlayHost = firstHost;
        document.body.append(firstHost);
        const rerender = await mount(element, () => overlayHost);
        const trigger = await focusTrigger();
        expect(firstHost.contains(popper())).to.equal(true);
        return { rerender, trigger };
    };

    it('should keep the exiting popup in the same host when blur closes it', async () => {
        const { trigger } = await openInHost();
        await act(async () => trigger.blur());
        const exiting = popper();
        expect(exiting === null || firstHost.contains(exiting)).to.equal(true);
    });

    it('should drop the exiting popup when the container changes', async () => {
        const { rerender, trigger } = await openInHost();
        await act(async () => trigger.blur());
        const second = document.createElement('div');
        document.body.append(second);
        overlayHost = second;
        await rerender();
        expect(popper()).to.equal(null);
        expect(document.body.querySelector(':scope > [role="tooltip"]')).to.equal(null);
    });

    it('should drop the exiting popup when the theme changes', async () => {
        const themed = (name: string) => (
            <ThemeProvider theme={createTheme({ palette: { mode: name === 'dark' ? 'dark' : 'light' } })}>
                {tooltipTrigger('Themed')}
            </ThemeProvider>
        );
        const { rerender, trigger } = await openInHost(themed('light'));
        await act(async () => trigger.blur());
        await rerender(themed('dark'));
        expect(popper()).to.equal(null);
    });

    it('should not move the popup to the body when the container becomes unavailable while open', async () => {
        const { rerender } = await openInHost();
        overlayHost = null;
        await rerender();
        expect(popper()).to.equal(null);
        expect(document.body.querySelector(':scope > [role="tooltip"]')).to.equal(null);
    });
});

describe('when the environment changes around a stateful trigger', () => {
    const field = () => document.querySelector<HTMLInputElement>('[data-cratis-tooltip-trigger]') as HTMLInputElement;
    const stateful = (visible: boolean, mode: 'light' | 'dark') => (
        <ThemeProvider theme={createTheme({ palette: { mode } })}>
            <Dialog title='Host' visible={visible} buttons={null}>
                <MuiTooltipSlot content='Field'>
                    <input type='text' aria-label='Field' />
                </MuiTooltipSlot>
            </Dialog>
        </ThemeProvider>
    );

    it('should keep the same trigger node and its state when the theme changes', async () => {
        const render = await mount(stateful(true, 'light'));
        const node = field();
        node.value = 'typed';
        await render(stateful(true, 'dark'));
        expect(field()).to.equal(node);
        expect(field().value).to.equal('typed');
    });

    it('should keep the same trigger node and its state when the container changes', async () => {
        let container: HTMLElement | null = document.body.appendChild(document.createElement('div'));
        const render = await mount(
            <MuiTooltipSlot content='Field'>
                <input type='text' aria-label='Field' />
            </MuiTooltipSlot>,
            () => container,
        );
        const node = field();
        node.value = 'typed';
        container = document.body.appendChild(document.createElement('div'));
        await render();
        expect(field()).to.equal(node);
        expect(field().value).to.equal('typed');
    });
});
