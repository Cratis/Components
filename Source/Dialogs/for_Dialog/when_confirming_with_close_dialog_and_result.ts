// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { vi } from 'vitest';
import { Dialog } from '../Dialog';
import {
    click,
    render,
    unmount,
    type DialogInTheDom,
} from './given/a_dialog_in_the_dom';

const { closeDialog } = vi.hoisted(() => ({ closeDialog: vi.fn() }));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => ({ closeDialog }),
}));

describe('when confirming with close dialog and result', () => {
    const resultPayload = { id: 'project-1', name: 'Project 1' };
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        closeDialog.mockReset();
        dialog = await render(
            React.createElement(Dialog, {
                title: 'Add project',
                visible: true,
                onConfirm: () => closeDialog(3, resultPayload),
                onCancel: () => closeDialog(4),
                buttons: 2,
                children: React.createElement('p', null, 'Dialog content'),
            }),
        );
        await click('Ok');
    });

    afterEach(async () => unmount(dialog));

    it('should close once with ok and the payload', () => {
        expect(closeDialog.mock.calls).to.have.lengthOf(1);
        expect(closeDialog.mock.calls[0][0]).to.equal(3);
        expect(closeDialog.mock.calls[0][1]).to.deep.equal(resultPayload);
    });
});
