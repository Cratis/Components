// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { Dialog } from '../Dialog';
import {
    type DialogInTheDom,
    pressEscape,
    render,
    unmount,
} from './given/a_dialog_in_the_dom';

describe('when busy dismissal is attempted', () => {
    let dialog: DialogInTheDom;
    const onCancel = vi.fn();

    beforeEach(async () => {
        onCancel.mockReset();
        dialog = await render(
            <Dialog
                title='Saving'
                isBusy
                dismissable
                onCancel={onCancel}
                buttons={<button type='button'>Custom footer action</button>}
            >
                <button type='button'>Content action</button>
            </Dialog>,
        );
    });

    afterEach(async () => {
        await unmount(dialog);
    });

    it('should keep every dialog action disabled', () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        expect(buttons.length).to.be.greaterThan(0);
        expect(buttons.every((button) => button.matches(':disabled'))).to.equal(true);
    });

    it('should ignore escape while work is in flight', async () => {
        await pressEscape();
        expect(onCancel.mock.calls).to.have.lengthOf(0);
    });
});
