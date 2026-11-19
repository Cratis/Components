// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { DialogResult } from '@cratis/arc.react/dialogs';
import { CratisComponentsProvider } from '@cratis/components';
import { Dialog, type DialogProps } from '@cratis/components/Dialogs';
import { designsystemetUiLibrary } from '../src/index.js';

let root: Root | undefined;
let container: HTMLElement | undefined;

const render = async (props: Partial<DialogProps>) => {
    const dialogProps: DialogProps = { title: 'Edit account', children: 'Dialog body', ...props };
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root?.render(
            createElement(CratisComponentsProvider, {
                library: designsystemetUiLibrary,
                children: createElement(Dialog, dialogProps),
            }),
        );
    });
};

const recordInto = (results: DialogResult[]) => (result: DialogResult) => {
    results.push(result);
};

const dialog = () => document.querySelector('dialog');

const cancel = async () => {
    await act(async () => {
        dialog()?.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
};

afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
});

describe('when rendering the Designsystemet dialog', () => {
    it('should render one open native modal dialog with the Cratis parts', async () => {
        await render({ subtitle: 'Owner details', pt: { root: { className: 'consumer-root' } } });

        const element = dialog();
        expect(element?.open).to.equal(true);
        expect(element?.classList.contains('ds-dialog')).to.equal(true);
        expect(element?.classList.contains('consumer-root')).to.equal(true);
        expect(element?.getAttribute('data-cratis-part')).to.equal('root');
        expect(element?.getAttribute('aria-describedby')).to.equal(
            element?.querySelector('[data-cratis-part="subtitle"]')?.id,
        );
        for (const part of ['header', 'title', 'subtitle', 'close', 'content', 'footer']) {
            expect(element?.querySelector(`[data-cratis-part="${part}"]`), part).not.to.equal(null);
        }
        expect(element?.querySelectorAll('[data-cratis-part="footer"] button').length).to.equal(2);
        expect(document.querySelectorAll('[role="dialog"][data-cratis-part="root"]').length).to.equal(0);
    });

    it('should give descendant overlays a host inside the dialog', async () => {
        await render({});

        expect(dialog()?.querySelector('[data-cratis-overlay-host]')).not.to.equal(null);
    });

    it('should close through Components when the close button is pressed', async () => {
        const results: DialogResult[] = [];
        await render({ onClose: recordInto(results) });

        await act(async () => {
            dialog()?.querySelector<HTMLButtonElement>('[data-cratis-part="close"]')?.click();
        });

        expect(results).to.deep.equal([DialogResult.Cancelled]);
    });

    it('should close through Components when Escape cancels the dialog', async () => {
        const results: DialogResult[] = [];
        await render({ onClose: recordInto(results) });

        await cancel();

        expect(results).to.deep.equal([DialogResult.Cancelled]);
        expect(dialog()?.open).to.equal(true);
    });

    it('should keep the dialog open when Escape is not allowed to dismiss it', async () => {
        const results: DialogResult[] = [];
        await render({ dismissable: false, onClose: recordInto(results) });

        await cancel();

        expect(results).to.deep.equal([]);
        expect(dialog()?.querySelector('[data-cratis-part="close"]')).to.equal(null);
    });

    it('should mark the root and close button while busy', async () => {
        await render({ isBusy: true });

        expect(dialog()?.hasAttribute('data-busy')).to.equal(true);
        const close = dialog()?.querySelector<HTMLButtonElement>('[data-cratis-part="close"]');
        expect(close?.disabled).to.equal(true);
        expect(close?.hasAttribute('data-disabled')).to.equal(true);
    });
});
