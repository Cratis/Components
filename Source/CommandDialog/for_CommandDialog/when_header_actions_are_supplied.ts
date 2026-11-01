// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import React from 'react';
import { vi } from 'vitest';
import {
    render,
    unmount,
    type DialogInTheDom,
} from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import type { DialogHeaderContext } from '../../configuration/DialogHeaderContext';
import { CommandDialog } from '../CommandDialog';

vi.mock('@cratis/arc.react/commands', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('@cratis/arc.react/commands');
    return {
        ...actual,
        CommandForm: (props: { children?: React.ReactNode }) =>
            React.createElement('div', null, props.children),
        useCommandFormContext: () => ({
            isValid: true,
            setCommandValues: () => {},
            setCommandResult: () => {},
        }),
        useCommandInstance: () => ({}),
    };
});

class TestCommand {
    name: string = '';
}

describe('when header actions are supplied to a command dialog', () => {
    let dialog: DialogInTheDom;
    let context: DialogHeaderContext;

    beforeEach(async () => {
        dialog = await render(
            React.createElement(
                CratisComponentsProvider,
                {
                    dialogHeaderActions: (received: DialogHeaderContext) => {
                        context = received;
                        return React.createElement('button', { type: 'button' }, 'Feedback');
                    },
                },
                React.createElement(
                    CommandDialog<TestCommand>,
                    {
                        command: TestCommand,
                        title: 'Example Project',
                        headerActions: React.createElement('button', { type: 'button' }, 'Help'),
                        sliceLocation: { module: 'Example', feature: 'Feature', slice: 'Slice' },
                    },
                    React.createElement('p', null, 'Body'),
                ),
            ),
        );
    });

    afterEach(async () => {
        await unmount(dialog);
    });

    it('should render the per-dialog and app-wide actions', () =>
        Array.from(document.querySelectorAll('[data-cratis-part="header-actions"] button'))
            .map((button) => button.textContent)
            .should.deep.equal(['Help', 'Feedback']));
    it('should tell the app-wide action this is a command dialog', () => context.isCommandDialog.should.be.true);
    it('should pass the slice location', () => context.sliceLocation!.slice.should.equal('Slice'));
});
