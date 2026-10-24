// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { afterEach, describe, it, vi } from 'vitest';
import { Dialog, type DialogProps } from '../Dialog';
import {
    hasCloseButton,
    pressEscape,
    render,
    unmount,
    type DialogInTheDom,
} from './given/a_dialog_in_the_dom';

describe('when configuring dismissal', () => {
    let dialog: DialogInTheDom;
    const onCancel = vi.fn();

    const mount = async (props: Partial<DialogProps>) => {
        onCancel.mockReset();
        dialog = await render(
            <Dialog title='Example dialog' onCancel={onCancel} {...props}>
                Example content
            </Dialog>,
        );
    };

    const clickOutside = async () => {
        await act(async () => {
            const backdrop = document.querySelector('[data-cratis-part="backdrop"]')!;
            backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
    };

    afterEach(async () => unmount(dialog));

    it('should allow outside dismissal by default', async () => {
        await mount({});
        await clickOutside();
        onCancel.mock.calls.should.have.lengthOf(1);
    });

    it('should disable only outside dismissal when requested', async () => {
        await mount({ dismissOnOutsideClick: false });
        await clickOutside();
        onCancel.mock.calls.should.have.lengthOf(0);
        hasCloseButton().should.equal(true);
        await pressEscape();
        onCancel.mock.calls.should.have.lengthOf(1);
    });

    it('should enable outside dismissal independently of dismissable', async () => {
        await mount({ dismissable: false, dismissOnOutsideClick: true });
        await clickOutside();
        onCancel.mock.calls.should.have.lengthOf(1);
    });

    it('should keep header and Escape dismissal enabled by default', async () => {
        await mount({});
        hasCloseButton().should.equal(true);
        await pressEscape();
        onCancel.mock.calls.should.have.lengthOf(1);
    });

    it('should retain the combined dismissable switch', async () => {
        await mount({ dismissable: false });
        hasCloseButton().should.equal(false);
        await pressEscape();
        onCancel.mock.calls.should.have.lengthOf(0);
    });

    it('should hide only the close button when requested', async () => {
        await mount({ showCloseButton: false });
        hasCloseButton().should.equal(false);
        await pressEscape();
        onCancel.mock.calls.should.have.lengthOf(1);
    });

    it('should disable Escape without hiding the close button', async () => {
        await mount({ closeOnEscape: false });
        hasCloseButton().should.equal(true);
        await pressEscape();
        onCancel.mock.calls.should.have.lengthOf(0);
    });

    it('should enable Escape independently of dismissable', async () => {
        await mount({ dismissable: false, closeOnEscape: true });
        hasCloseButton().should.equal(false);
        await pressEscape();
        onCancel.mock.calls.should.have.lengthOf(1);
    });

    it('should show the close button independently of dismissable', async () => {
        await mount({ dismissable: false, showCloseButton: true });
        hasCloseButton().should.equal(true);
    });

    it('should keep explicit dismissal overrides inert while busy', async () => {
        await mount({
            isBusy: true,
            closeOnEscape: true,
            showCloseButton: true,
            dismissOnOutsideClick: true,
        });
        document
            .querySelector<HTMLButtonElement>('[data-cratis-part="close"]')!
            .disabled.should.equal(true);
        await pressEscape();
        await clickOutside();
        onCancel.mock.calls.should.have.lengthOf(0);
    });
});
