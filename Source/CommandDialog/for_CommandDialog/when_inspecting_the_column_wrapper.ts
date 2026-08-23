// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { vi } from 'vitest';
import { CommandFormColumnDisplayName, isCommandFormColumn } from '../../CommandForm/commandFormMarkers';

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
        { Column: (props: { children?: React.ReactNode }) => React.createElement('div', null, props.children) }
    ),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => {},
        setCommandResult: () => {},
    }),
    useCommandInstance: () => ({}),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

// This dialog's column wrapper is the one marker this package *writes* rather than
// reads: `CommandForm` in @cratis/arc.react is what classifies it. The assertions
// below are therefore the producer half of the cross-package contract — the field
// specs cover the consumer half.
describe('when inspecting the column wrapper', () => {
    let Column: object;

    beforeEach(async () => {
        vi.resetModules();
        const { CommandDialog } = await import('../CommandDialog');
        Column = (CommandDialog as unknown as { Column: object }).Column;
    });

    it('should carry the column marker', () => {
        (Column as { isCommandFormColumn?: boolean }).isCommandFormColumn!.should.equal(true);
    });

    it('should be recognized as a column', () => {
        isCommandFormColumn(Column).should.be.true;
    });

    // The legacy label has to stay: an @cratis/arc.react that predates the marker
    // classifies columns by this string alone, and this package's peer range admits
    // exactly those versions. Dropping it would silently unbind every column there.
    it('should still carry the legacy display name for older arc', () => {
        (Column as { displayName?: string }).displayName!.should.equal(CommandFormColumnDisplayName);
    });
});
