// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { expect } from 'chai';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, it } from 'vitest';
import { DialogResult } from '@cratis/arc.react/dialogs';
import { CratisComponentsProvider } from '@cratis/components';
import { Dialog, type DialogProps } from '@cratis/components/Dialogs';
import { muiUiLibrary } from '../src/index.js';

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
                library: muiUiLibrary,
                children: createElement(Dialog, dialogProps),
            }),
        );
    });
};

const recordInto = (results: DialogResult[]) => (result: DialogResult) => {
    results.push(result);
};

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

const pressEscape = async (target: EventTarget) => {
    await act(async () => {
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    });
};

afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
});

describe('when rendering the MUI dialog', () => {
    it('should render one labelled modal section with the Cratis parts', async () => {
        await render({ subtitle: 'Owner details', pt: { root: { className: 'consumer-root' } } });

        const element = dialog();
        expect(element?.tagName).to.equal('SECTION');
        expect(element?.classList.contains('consumer-root')).to.equal(true);
        expect(element?.getAttribute('data-cratis-part')).to.equal('root');
        expect(element?.getAttribute('aria-labelledby')).to.equal(
            element?.querySelector('[data-cratis-part="title"]')?.id,
        );
        expect(element?.getAttribute('aria-describedby')).to.equal(
            element?.querySelector('[data-cratis-part="subtitle"]')?.id,
        );
        for (const part of ['header', 'title', 'subtitle', 'close', 'content', 'footer']) {
            expect(element?.querySelector(`[data-cratis-part="${part}"]`), part).not.to.equal(null);
        }
        expect(element?.querySelectorAll('[data-cratis-part="footer"] button').length).to.equal(2);
        expect(document.querySelectorAll('[role="dialog"]').length).to.equal(1);
    });

    it('should give descendant overlays a host inside the dialog', async () => {
        await render({});

        expect(dialog()?.querySelector('[data-cratis-overlay-container]')).not.to.equal(null);
    });

    it('should close through Components when the close button is pressed', async () => {
        const results: DialogResult[] = [];
        await render({ onClose: recordInto(results) });

        await act(async () => {
            dialog()?.querySelector<HTMLButtonElement>('[data-cratis-part="close"]')?.click();
        });

        expect(results).to.deep.equal([DialogResult.Cancelled]);
    });

    it('should close through Components when Escape is pressed inside the dialog', async () => {
        const results: DialogResult[] = [];
        await render({ onClose: recordInto(results) });

        await pressEscape(dialog() as HTMLElement);

        expect(results).to.deep.equal([DialogResult.Cancelled]);
    });

    it('should close through Components when Escape is pressed with focus outside the dialog', async () => {
        const results: DialogResult[] = [];
        await render({ onClose: recordInto(results) });

        await pressEscape(document.body);

        expect(results).to.deep.equal([DialogResult.Cancelled]);
    });

    it('should keep the dialog open when Escape is not allowed to dismiss it', async () => {
        const results: DialogResult[] = [];
        await render({ dismissable: false, onClose: recordInto(results) });

        await pressEscape(dialog() as HTMLElement);
        await pressEscape(document.body);

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
