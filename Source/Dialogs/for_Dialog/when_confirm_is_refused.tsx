// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { act, useState } from 'react';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Dialog } from '../Dialog';
import {
    type DialogInTheDom,
    click,
    focusedElement,
    focusIsInsideTheDialog,
    render,
    unmount,
} from './given/a_dialog_in_the_dom';

const submit = vi.fn();
let releaseSubmit: () => void = () => undefined;

const RefusingDialog = () => {
    const [busy, setBusy] = useState(false);
    return (
        <Dialog
            title='Save changes'
            isBusy={busy}
            onConfirm={async () => {
                submit();
                setBusy(true);
                await new Promise<void>((resolve) => {
                    releaseSubmit = resolve;
                });
                setBusy(false);
                return false;
            }}
        >
            Body
        </Dialog>
    );
};

const liveRegionText = () =>
    document.querySelector('.cratis-dialog__live-region')?.textContent ?? '';

describe('when confirm is refused', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        submit.mockReset();
        dialog = await render(<RefusingDialog />, 'button:Ok');
        await click('Ok');
    });

    afterEach(async () => unmount(dialog));

    it('should keep focus inside the dialog while busy', () => {
        expect(focusIsInsideTheDialog()).to.equal(true);
        expect(focusedElement()).to.equal('button:Ok');
    });

    it('should not submit again when the busy confirm is activated', async () => {
        await click('Ok');
        expect(submit.mock.calls).to.have.lengthOf(1);
    });

    it('should return focus to the confirm button and announce the outcome', async () => {
        await act(async () => releaseSubmit());
        expect(focusedElement()).to.equal('button:Ok');
        expect(liveRegionText()).to.equal(
            'The action was not completed. Review the dialog and try again.',
        );
    });

    it('should not re-submit from a held Enter once focus has returned', async () => {
        await act(async () => releaseSubmit());
        const confirm = document.activeElement as HTMLButtonElement;
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            repeat: true,
            bubbles: true,
            cancelable: true,
        });
        await act(async () => {
            confirm.dispatchEvent(event);
        });
        expect(event.defaultPrevented).to.equal(true);
    });
});
