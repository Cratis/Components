// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useRef, useState, type ComponentType, type SyntheticEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import { Tooltip } from '../Common/Tooltip';
import { Dropdown } from '../Dropdown/Dropdown';
import { unstable_defineUiLibrary } from '../renderer/manifest';
import { Dialog, type DialogProps } from './Dialog';
import type { CratisDialogSlotProps } from './DialogHost';
import '../tokens.css';
import '../theme.css';
import './Dialog.css';

// A minimal top-layer adapter: a native <dialog> opened with showModal(), owning Escape and
// focus restoration, and registering an element inside itself as its descendants' overlay container.
const overlayContainerStyle = { position: 'fixed', top: 0, left: 0, width: 0, height: 0 } as const;

const NativeDialog = ({ title, visible = true, host }: CratisDialogSlotProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useLayoutEffect(() => {
        const dialog = dialogRef.current!;
        if (visible && !dialog.open) dialog.showModal();
        if (!visible && dialog.open) dialog.close();
        return () => {
            if (dialog.open) dialog.close();
        };
    }, [visible]);
    const onCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
        // React walks a nested dialog's cancel up the component tree; only the target handles it.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        if (host.dismissal.escape) host.dismiss();
    };
    return (
        <dialog ref={dialogRef} aria-labelledby={`${host.id}-title`} onCancel={onCancel} style={{ zIndex: host.zIndex }}>
            <h2 id={`${host.id}-title`} ref={host.titleRef}>
                {title}
            </h2>
            {host.content}
            {host.footer}
            {host.liveRegion}
            <div ref={host.registerOverlayContainer} style={overlayContainerStyle} />
        </dialog>
    );
};

// The routed declaration is the same whether a stable or an unstable library supplies it.
const library = unstable_defineUiLibrary({
    id: 'native-dialog-test',
    displayName: 'Native dialog test',
    abi: 1,
    level: 'primitive',
    profile: 'test-controls/v1',
    capabilities: ['slot.render'],
    slots: {
        'dialogs.dialog': {
            mode: 'atomic',
            fidelity: 'native',
            // SAFETY: the routed adapter dialog receives its host next to the public props.
            render: NativeDialog as ComponentType<DialogProps>,
        },
    },
});

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let selections: unknown[];

beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    selections = [];
});

afterEach(() => {
    root.unmount();
    container.remove();
});

const NestedExample = () => {
    const [outer, setOuter] = useState(false);
    const [nested, setNested] = useState(false);
    return (
        <CratisComponentsProvider library={library}>
            <button type='button' onClick={() => setOuter(true)}>
                Open outer
            </button>
            {outer && (
                <Dialog title='Outer dialog' buttons={null} closeOnEscape onCancel={() => setOuter(false)}>
                    <Dropdown options={['Alpha', 'Beta']} placeholder='Pick one' onChange={(value) => selections.push(value)} />
                    <Tooltip content='Helpful tip'>
                        <button type='button'>Tip trigger</button>
                    </Tooltip>
                    <button type='button' onClick={() => setNested(true)}>
                        Open nested
                    </button>
                    {nested && (
                        <Dialog title='Nested dialog' buttons={null} closeOnEscape onCancel={() => setNested(false)}>
                            <button type='button'>Nested action</button>
                        </Dialog>
                    )}
                </Dialog>
            )}
        </CratisComponentsProvider>
    );
};

const dialogNamed = (name: string) => page.getByRole('dialog', { name });

const isTopmostAt = (element: Element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit !== null && element.contains(hit);
};

const openOuter = async () => {
    root.render(<NestedExample />);
    await userEvent.click(page.getByRole('button', { name: 'Open outer' }));
    await expect.element(dialogNamed('Outer dialog')).toBeVisible();
};

describe('a native top-layer dialog with a registered overlay container', () => {
    it('keeps a dropdown popover above the dialog and usable', async () => {
        await openOuter();
        await userEvent.click(page.getByRole('button', { name: /Pick one/ }));
        const option = page.getByRole('option', { name: 'Beta' });
        await expect.element(option).toBeVisible();

        const outer = dialogNamed('Outer dialog').element();
        expect(outer.contains(option.element())).toBe(true);
        expect(isTopmostAt(option.element())).toBe(true);

        await userEvent.click(option);
        expect(selections).toHaveLength(1);
        expect(outer.hasAttribute('open')).toBe(true);
    });

    it('keeps a tooltip above the dialog', async () => {
        await openOuter();
        // The modal's initial focus is on the dropdown; the tooltip trigger is next in tab order.
        await userEvent.keyboard('{Tab}');
        await expect.element(page.getByRole('button', { name: 'Tip trigger' })).toHaveFocus();
        const tooltip = page.getByRole('tooltip');
        await expect.element(tooltip).toBeVisible();

        expect(dialogNamed('Outer dialog').element().contains(tooltip.element())).toBe(true);
        expect(isTopmostAt(tooltip.element())).toBe(true);
    });

    it('stacks a nested dialog above its parent and lets Escape close only the topmost', async () => {
        await openOuter();
        const openNested = page.getByRole('button', { name: 'Open nested' });
        await userEvent.click(openNested);
        const nested = dialogNamed('Nested dialog');
        await expect.element(nested).toBeVisible();
        expect(isTopmostAt(page.getByRole('button', { name: 'Nested action' }).element())).toBe(true);

        await userEvent.keyboard('{Escape}');
        await expect.element(nested).not.toBeInTheDocument();
        await expect.element(dialogNamed('Outer dialog')).toBeVisible();
        await expect.element(openNested).toHaveFocus();

        await userEvent.keyboard('{Escape}');
        await expect.element(dialogNamed('Outer dialog')).not.toBeInTheDocument();
        await expect.element(page.getByRole('button', { name: 'Open outer' })).toHaveFocus();
    });
});
