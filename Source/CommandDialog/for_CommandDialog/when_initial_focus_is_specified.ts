// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
// @vitest-environment jsdom

import { expect } from 'chai';
import React from 'react';
import { vi } from 'vitest';
import { DialogInitialFocus } from '../../Dialogs/DialogInitialFocus';
import {
    click,
    focusedElement,
    pressEnterOnFocusedElement,
    render,
    unmount,
    type DialogInTheDom,
} from '../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';

const { executeCommand, succeeded } = vi.hoisted(() => ({
    executeCommand: vi.fn(async () => ({
        isSuccess: true,
        isValid: true,
        validationResults: [],
    })),
    succeeded: vi.fn(),
}));

vi.mock('@cratis/arc.react/commands', () => ({
    CommandForm: (props: { children?: React.ReactNode }) =>
        React.createElement('div', null, props.children),
    useCommandFormContext: () => ({
        isValid: true,
        setCommandValues: () => {
            /* not part of this scenario */
        },
        setCommandResult: () => {
            /* not part of this scenario */
        },
    }),
    useCommandInstance: () => ({ execute: executeCommand }),
    CommandFormFieldWrapper: (props: { field?: React.ReactNode }) =>
        React.createElement('div', null, props.field),
}));

class DeletePersonalData {
    personId: string = '';
}

describe('when a command dialog is given an initial focus', () => {
    let dialog: DialogInTheDom;

    const renderDialog = async (initialFocus?: DialogInitialFocus) => {
        executeCommand.mockClear();
        succeeded.mockClear();

        const { CommandDialog } = await import('../CommandDialog');

        // SAFETY: The generated command proxy constructor is erased by this test harness only.
        dialog = await render(
            React.createElement(CommandDialog, {
                command: DeletePersonalData as unknown as new () => object,
                title: 'Delete personal data',
                visible: true,
                initialFocus,
                onSuccess: succeeded,
                children: React.createElement('p', null, 'This cannot be undone'),
            }),
        );
    };

    afterEach(async () => await unmount(dialog));

    it('should focus the Ok button when nothing is specified', async () => {
        await renderDialog();

        focusedElement().should.equal('button:Ok');
    });

    it('should forward the choice to the dialog it wraps', async () => {
        await renderDialog(DialogInitialFocus.Cancel);

        focusedElement().should.equal('button:Cancel');
    });

    it('should forward a request to focus the content', async () => {
        await renderDialog(DialogInitialFocus.Content);

        focusedElement().should.equal('h2:Delete personal data');
    });

    it('should not run the command on an Enter that repeats onto the freshly mounted dialog', async () => {
        await renderDialog(DialogInitialFocus.Cancel);

        await pressEnterOnFocusedElement();

        expect(executeCommand.mock.calls).to.have.lengthOf(0);
    });

    it('should still run the command when the user deliberately confirms', async () => {
        await renderDialog(DialogInitialFocus.Cancel);

        await click('Ok');

        expect(executeCommand.mock.calls).to.have.lengthOf(1);
        expect(succeeded.mock.calls).to.have.lengthOf(1);
    });
});
