// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { Dialog } from '../Dialog';
import {
    type DialogInTheDom,
    click,
    focusedElement,
    initialFocusSettled,
    liveRegionText,
    refusalAnnounced,
    render,
    unmount,
} from './given/a_dialog_in_the_dom';

describe('when confirm is refused with feedback', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        dialog = await render(
            <Dialog
                title='Save changes'
                onConfirm={() => false}
                refusalFeedback={() => ({
                    message: 'Two fields need attention',
                    focus: document.querySelector<HTMLElement>('#amount'),
                })}
            >
                <input id='amount' aria-label='Amount' />
            </Dialog>,
            'button:Ok',
        );
        await initialFocusSettled();
        await click('Ok');
        await refusalAnnounced();
    });

    afterEach(async () => unmount(dialog));

    it('should move focus to the element the feedback names', () => expect(focusedElement()).to.equal('input:Amount'));

    it('should announce the feedback message', () => expect(liveRegionText()).to.equal('Two fields need attention'));
});
