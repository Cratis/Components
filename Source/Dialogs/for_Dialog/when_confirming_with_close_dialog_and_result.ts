// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { Dialog } from '../Dialog';

const { closeDialog } = vi.hoisted(() => ({
    closeDialog: vi.fn(),
}));

vi.mock('primereact/dialog', () => ({
    Dialog: (props: { footer?: React.ReactNode; children?: React.ReactNode }) =>
        React.createElement('div', null, props.footer, props.children),
}));

vi.mock('primereact/button', () => ({
    Button: (props: { icon?: string; label?: string; onClick?: () => Promise<void> | void; disabled?: boolean }) => {
        if (props.icon === 'pi pi-check' && props.onClick) {
            props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.label);
    },
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => ({ closeDialog }),
}));

describe('when confirming with close dialog and result', () => {
    const resultPayload = { id: 'project-1', name: 'Project 1' };

    beforeEach(() => {
        closeDialog.mockReset();

        const element = React.createElement(Dialog, {
            title: 'Add project',
            visible: true,
            onConfirm: () => closeDialog(3, resultPayload),
            onCancel: () => closeDialog(4),
            buttons: 2,
            children: React.createElement('p', null, 'Dialog content'),
        });

        renderToStaticMarkup(element);
    });

    it('should_close_once_with_ok_and_the_payload', () => {
        if (closeDialog.mock.calls.length !== 1) {
            throw new Error(`Expected one closeDialog call, got ${closeDialog.mock.calls.length}`);
        }
        closeDialog.mock.calls[0][0].should.equal(3);
        closeDialog.mock.calls[0][1].should.deep.equal(resultPayload);
    });
});
