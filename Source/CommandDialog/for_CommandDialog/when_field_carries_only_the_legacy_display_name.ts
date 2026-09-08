// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandFormFieldDisplayName } from '../../CommandForm/commandFormMarkers';



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
    // Tagged so the markup shows whether the dialog recognized the child as a
    // field and wrapped it. An unrecognized child is returned untouched — no
    // container, so no label, no bound value and no change handler.
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'field-wrapper' }, props.field),
}));


class TestCommand {
    name: string = '';
}

// The compatibility case, and the one that keeps a new @cratis/components working
// against an older @cratis/arc.react: this field carries the legacy `displayName`
// and no marker at all, exactly as a hand-rolled field or a pre-marker release of
// Arc produces. Deleting the fallback would silently unbind every one of them.
const HandRolledField = (props: { value?: (c: TestCommand) => unknown }) => {
    void props;
    return React.createElement('input', { 'data-testid': 'the-field' });
};
HandRolledField.displayName = CommandFormFieldDisplayName;

describe('when a field carries only the legacy displayName', () => {
    let html: string;

    beforeEach(async () => {
        // The project runs specs with `isolate: false`, so a module imported by an
        // earlier spec file stays cached with that file's mocks bound in, and the
        // order files run in is not stable between runs. Re-evaluate CommandDialog
        // under this file's own mocks so the tagged CommandFormFieldWrapper is
        // always the one in effect.
        vi.resetModules();
        const { CommandDialog } = await import('../CommandDialog');

        const element = React.createElement(
            CommandDialog,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(HandRolledField, { value: (c: TestCommand) => c.name })
        );
        html = renderToStaticMarkup(element);
    });

    it('should recognize the child as a field and wrap it', () => {
        html.should.include('field-wrapper');
    });

    it('should render the field itself', () => {
        html.should.include('the-field');
    });
});
