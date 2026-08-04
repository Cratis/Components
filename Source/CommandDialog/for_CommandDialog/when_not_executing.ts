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
    // PrimeReact 11 Button renders children (the v10 label/icon/loading props are gone).
    // A busy dialog now disables its confirm button rather than setting a loading flag.
    Button: (props: { disabled?: boolean; children?: React.ReactNode }) =>
        React.createElement('button', { disabled: props.disabled }, props.children),
}));

vi.mock('@cratis/arc.react/dialogs', () => ({
    DialogButtons: { Ok: 1, OkCancel: 2, YesNo: 3, YesNoCancel: 4 },
    DialogResult: { None: 0, Yes: 1, No: 2, Ok: 3, Cancelled: 4 },
    useDialogContext: () => undefined,
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => {},
        setCommandResult: () => {},
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
}

describe('when CommandDialog is in its initial state', () => {
    let html: string;

    beforeEach(async () => {
        // The project runs specs with `isolate: false`, so a module imported by an
        // earlier spec file stays cached with that file's mocks bound in, and the
        // order files run in is not stable between runs. Re-evaluate under this
        // file's own mocks so this spec neither inherits another file's stubs nor
        // leaves its own behind — a static import here passes or fails by luck.
        vi.resetModules();
        const { CommandDialog } = await import('../CommandDialog');

        const element = React.createElement(CommandDialog, {
            command: TestCommand as unknown as new () => object,
            visible: true,
            title: 'Test Dialog',
        });
        html = renderToStaticMarkup(element);
    });

    it('should_not_have_buttons_disabled_due_to_busy', () => {
        // A busy dialog swaps the confirm icon for a spinner; a non-busy dialog shows none.
        html.should.not.include('pi-spinner');
    });
});
