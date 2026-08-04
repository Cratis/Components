// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandFormFieldDisplayName, markAsCommandFormField } from '../../CommandForm/commandFormMarkers';

vi.mock('primereact/dialog', () => {
    // PrimeReact 11's Dialog is compositional; each part is a pass-through that
    // renders its children so the content reaches the markup.
    const part = (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children);
    return {
        Dialog: {
            Root: part, Portal: part, Backdrop: part, Positioner: part, Popup: part,
            Header: part, Title: part, Close: part, Content: part, Footer: part,
        },
    };
});

vi.mock('primereact/button', () => ({
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
    // Tagged so the markup shows whether the dialog recognized the child as a
    // field and wrapped it. An unrecognized child is returned untouched — no
    // container, so no label, no bound value and no change handler.
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'field-wrapper' }, props.field),
}));


const overwriteDisplayName = (component: object, name: string): void => {
    (component as { displayName?: string }).displayName = name;
};

class TestCommand {
    name: string = '';
}

// A field marked the way `asCommandFormField` marks one, whose `displayName` was
// then rewritten by a build transform — what Storybook's react-docgen-typescript
// integration does by default to every component it processes.
const RenamedField = markAsCommandFormField((props: { value?: (c: TestCommand) => unknown }) => {
    void props;
    return React.createElement('input', { 'data-testid': 'the-field' });
});
overwriteDisplayName(RenamedField, 'AppInputTextField');

describe('when a field displayName has been overwritten by a build transform', () => {
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
            React.createElement(RenamedField, { value: (c: TestCommand) => c.name })
        );
        html = renderToStaticMarkup(element);
    });

    it('should still recognize the child as a field and wrap it', () => {
        html.should.include('field-wrapper');
    });

    it('should still render the field itself', () => {
        html.should.include('the-field');
    });

    // Guards the two assertions above: were the overwrite to silently fail, they
    // would pass through the legacy fallback and prove nothing about the marker.
    it('should have actually lost the legacy display name', () => {
        (RenamedField as { displayName?: string }).displayName!
            .should.not.equal(CommandFormFieldDisplayName);
    });
});
