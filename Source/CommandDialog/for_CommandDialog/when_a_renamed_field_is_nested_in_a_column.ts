// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { CommandFormFieldDisplayName, markAsCommandFormField } from '../../CommandForm/commandFormMarkers';

vi.mock('primereact/dialog', () => {
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
    CommandForm: Object.assign(
        (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children),
        {
            Column: (props: { children?: React.ReactNode }) =>
                React.createElement('div', { 'data-testid': 'column' }, props.children),
        }
    ),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => {},
        setCommandResult: () => {},
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', { 'data-testid': 'field-wrapper' }, props.field),
}));

const overwriteDisplayName = (component: object, name: string): void => {
    (component as { displayName?: string }).displayName = name;
};

class TestCommand {
    name: string = '';
}

const RenamedField = markAsCommandFormField((props: { value?: (c: TestCommand) => unknown }) => {
    void props;
    return React.createElement('input', { 'data-testid': 'the-field' });
});
overwriteDisplayName(RenamedField, 'AppInputTextField');

// `processChildren` only tests the child itself for fieldness; anything else with
// children it recurses into. A field inside `CommandDialog.Column` is therefore
// reached one level down, and a marker that worked only for direct children would
// still leave every column-laid-out form broken. This is the arrangement the
// column API exists for, so it gets its own spec rather than being assumed from
// the flat case.
describe('when a renamed field is nested in a column', () => {
    let html: string;

    beforeEach(async () => {
        // The project runs specs with `isolate: false`, so a module imported by an
        // earlier spec file stays cached with that file's mocks bound in, and the
        // order files run in is not stable between runs. Re-evaluate CommandDialog
        // under this file's own mocks.
        vi.resetModules();
        const { CommandDialog } = await import('../CommandDialog');

        const element = React.createElement(
            CommandDialog,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(
                (CommandDialog as unknown as { Column: React.ComponentType<{ children?: React.ReactNode }> }).Column,
                null,
                React.createElement(RenamedField, { value: (c: TestCommand) => c.name })
            )
        );
        html = renderToStaticMarkup(element);
    });

    it('should_still_recognise_the_nested_field_and_wrap_it', () => {
        html.should.include('field-wrapper');
    });

    it('should_still_render_the_column_around_it', () => {
        html.should.include('column');
    });

    it('should_still_render_the_field_itself', () => {
        html.should.include('the-field');
    });

    // Guards the assertions above: were the overwrite to silently fail, they would
    // pass through the legacy fallback and prove nothing about the marker.
    it('should_have_actually_lost_the_legacy_display_name', () => {
        (RenamedField as { displayName?: string }).displayName!
            .should.not.equal(CommandFormFieldDisplayName);
    });
});
