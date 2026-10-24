// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Dialog, type DialogProps } from './Dialog';
import { CratisComponentsProvider } from '../Common/CratisComponentsProvider';
import '../tokens.css';
import '../theme.css';
import './Dialog.css';

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let cancellations: number;

beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    cancellations = 0;
});

afterEach(() => {
    root.unmount();
    host.remove();
});

const open = async (props: Partial<DialogProps>) => {
    root.render(
        <CratisComponentsProvider>
            <Dialog
                title='Example dialog'
                onCancel={() => {
                    cancellations++;
                    return false;
                }}
                {...props}
            >
                Example content
            </Dialog>
        </CratisComponentsProvider>,
    );
    await expect.element(page.getByRole('dialog')).toBeVisible();
};

const clickOutside = async () => {
    const backdrop = document.querySelector<HTMLElement>(
        '[data-cratis-part="backdrop"]',
    )!;
    await userEvent.click(backdrop, { position: { x: 5, y: 5 } });
};

const FocusExample = () => {
    const [visible, setVisible] = useState(false);
    return (
        <CratisComponentsProvider>
            <button type='button' onClick={() => setVisible(true)}>
                Open dialog
            </button>
            <Dialog
                title='Focus example'
                visible={visible}
                buttons={null}
                dismissable={false}
                closeOnEscape
                onClose={() => setVisible(false)}
            >
                <button type='button'>First action</button>
                <button type='button'>Last action</button>
            </Dialog>
        </CratisComponentsProvider>
    );
};

describe('independent dialog dismissal', () => {
    it('should retain focus containment and restoration with independent dismissal', async () => {
        root.render(<FocusExample />);
        const trigger = page.getByRole('button', { name: 'Open dialog' });
        await trigger.click();
        await expect.element(page.getByRole('dialog')).toBeVisible();
        for (let index = 0; index < 4; index++) {
            await userEvent.keyboard('{Tab}');
            expect(
                document
                    .querySelector('[role="dialog"]')!
                    .contains(document.activeElement),
            ).toBe(true);
        }
        await userEvent.keyboard('{Escape}');
        await expect.element(trigger).toHaveFocus();
    });

    it('should retain outside dismissal by default', async () => {
        await open({});
        await clickOutside();
        expect(cancellations).toBe(1);
    });

    it('should disable outside dismissal without disabling Escape or the close button', async () => {
        await open({ dismissOnOutsideClick: false });
        await clickOutside();
        expect(cancellations).toBe(0);
        await userEvent.keyboard('{Escape}');
        expect(cancellations).toBe(1);
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        expect(cancellations).toBe(2);
    });

    it('should enable only outside dismissal over the combined switch', async () => {
        await open({ dismissable: false, dismissOnOutsideClick: true });
        await userEvent.keyboard('{Escape}');
        expect(cancellations).toBe(0);
        await expect
            .element(page.getByRole('button', { name: 'Close', exact: true }))
            .not.toBeInTheDocument();
        await clickOutside();
        expect(cancellations).toBe(1);
    });

    it('should keep all dismissal paths blocked while busy despite overrides', async () => {
        await open({
            isBusy: true,
            dismissOnOutsideClick: true,
            closeOnEscape: true,
            showCloseButton: true,
        });
        await clickOutside();
        await userEvent.keyboard('{Escape}');
        await expect
            .element(page.getByRole('button', { name: 'Close', exact: true }))
            .toBeDisabled();
        expect(cancellations).toBe(0);
    });
});
