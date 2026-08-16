// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { Dialog } from '../Dialog';

const { closeDialog } = vi.hoisted(() => ({
    closeDialog: vi.fn(),
}));

vi.mock('primereact/dialog', () => {
    // PrimeReact 11's Dialog is compositional; each part is a pass-through that
    // renders its children so the footer buttons and content reach the markup.
    const part = (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children);
    return {
        Dialog: {
            Root: part, Portal: part, Backdrop: part, Positioner: part, Popup: part,
            Header: part, Title: part, Close: part, Content: part, Footer: part,
        },
    };
});

vi.mock('primereact/button', () => ({
    // PrimeReact 11 Button renders children (the v10 label/icon props are gone), and the
    // dialog marks the button its focus trap should land on with `data-autofocus` rather
    // than React's autoFocus prop. That marker identifies the confirm button, whose click
    // this SSR render stands in for.
    Button: (props: { 'data-autofocus'?: string; onClick?: () => Promise<void> | void; disabled?: boolean; children?: React.ReactNode }) => {
        if (props['data-autofocus'] !== undefined && props.onClick) {
            void props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.children);
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
