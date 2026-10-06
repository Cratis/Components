// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';

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

class TestCommand {
    name: string = '';
}

// A render-prop helper, such as a paged-results component, calls its children as a function.
const Render = (props: { children: () => React.ReactNode }) =>
    React.createElement(React.Fragment, null, props.children());

describe('when a child takes a render function', () => {
    let html: string;
    let error: unknown;

    beforeEach(async () => {
        // The project runs specs with `isolate: false`; re-evaluate CommandDialog under
        // this file's own mocks rather than reusing another file's cached module.
        vi.resetModules();
        const { CommandDialog } = await import('../CommandDialog');

        const element = React.createElement(
            CommandDialog,
            {
                command: TestCommand as unknown as new () => object,
                visible: true,
                title: 'Test Dialog',
            },
            React.createElement(Render, null, () => React.createElement('p', null, 'Evidence'))
        );
        try {
            html = renderToStaticMarkup(element);
        } catch (caught) {
            error = caught;
        }
    });

    it('should not throw while rendering', () => {
        (error === undefined).should.be.true;
    });

    it('should render what the render function returns', () => {
        html.should.include('Evidence');
    });
});
