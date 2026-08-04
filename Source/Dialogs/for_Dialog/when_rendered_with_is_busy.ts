// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

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
    // PrimeReact 11 Button renders children (the v10 label/icon props are gone); the
    // confirm button carries autoFocus, which stands in for the click in this SSR render.
    Button: (props: { autoFocus?: boolean; onClick?: () => void | Promise<void>; disabled?: boolean; children?: React.ReactNode }) => {
        if (props.autoFocus && props.onClick) {
            void props.onClick();
        }
        return React.createElement('button', { disabled: props.disabled }, props.children);
    },
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

describe('when rendered with is busy', () => {
    let html: string;

    beforeEach(async () => {
        // The project runs specs with `isolate: false`, so a module imported by an
        // earlier spec file stays cached with that file's mocks bound in, and the
        // order files run in is not stable between runs. Re-evaluate under this
        // file's own mocks so this spec neither inherits another file's stubs nor
        // leaves its own behind — a static import here passes or fails by luck.
        vi.resetModules();
        const { Dialog } = await import('../Dialog');

        const element = React.createElement(Dialog, {
            title: 'Save changes',
            visible: true,
            isBusy: true,
            buttons: 2,
            children: React.createElement('p', null, 'Dialog content'),
        });

        html = renderToStaticMarkup(element);
    });

    it('should_disable_all_buttons', () => {
        const disabledCount = (html.match(/disabled=""/g) || []).length;
        disabledCount.should.equal(2);
    });
});

