// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandDialog } from '../CommandDialog';



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

    beforeEach(() => {
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
