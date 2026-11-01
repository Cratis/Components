// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { vi } from 'vitest';

const { received } = vi.hoisted(() => ({ received: { props: {} as Record<string, unknown> } }));

vi.mock('../../Dialogs/Dialog', () => ({
    Dialog: (props: Record<string, unknown> & { children?: React.ReactNode }) => {
        received.props = props;
        return React.createElement('div', null, props.children);
    },
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
        getFieldError: () => undefined,
    }),
    useCommandInstance: () => ({ execute: async () => ({}) }),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class TestCommand {
    name: string = '';
}

describe('when header actions are supplied to a stepper command dialog', () => {
    const headerActions = React.createElement('button', { type: 'button' }, 'Help');
    const sliceLocation = { module: 'Example', feature: 'Feature', slice: 'Slice' };

    beforeEach(async () => {
        vi.resetModules();
        const { renderToStaticMarkup } = await import('react-dom/server');
        const { StepperCommandDialog } = await import('../StepperCommandDialog');
        const { StepperPanel } = await import('../StepperPanel');
        renderToStaticMarkup(
            React.createElement(
                StepperCommandDialog<TestCommand>,
                {
                    command: TestCommand as unknown as new () => object,
                    title: 'Example wizard',
                    headerActions,
                    hideGlobalHeaderActions: true,
                    sliceLocation,
                },
                React.createElement(StepperPanel, { header: 'Only step' }, 'Content'),
            ),
        );
    });

    it('should forward the header actions to the dialog', () => received.props.headerActions!.should.equal(headerActions));
    it('should forward the opt-out to the dialog', () => received.props.hideGlobalHeaderActions!.should.be.true);
    it('should forward the slice location to the dialog', () => received.props.sliceLocation!.should.equal(sliceLocation));
    it('should mark the dialog as a command dialog', () => received.props.isCommandDialog!.should.be.true);
});
