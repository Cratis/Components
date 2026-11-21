// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { expect } from 'chai';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import {
    click,
    focusedElement,
    initialFocusSettled,
    liveRegionText,
    refusalAnnounced,
    render,
    unmount,
    type DialogInTheDom,
} from '../../../Dialogs/for_Dialog/given/a_dialog_in_the_dom';
import { CommandDialog } from '../../CommandDialog';
import { Fields, refusal, TestCommand } from './given/a_command_refused_by_validation';

vi.mock('@cratis/arc.react/dialogs', async () => (await import('./given/a_command_refused_by_validation')).dialogs);
vi.mock('@cratis/arc.react/commands', async () => (await import('./given/a_command_refused_by_validation')).commands);

const validationFailure = vi.fn();

describe('when submit is blocked by validation and no announcement is supplied', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        validationFailure.mockReset();
        refusal.validationResults = [
            { message: 'Name is required', members: ['name'] },
            { message: 'Email is invalid', members: ['email'] },
        ];
        dialog = await render(
            <CommandDialog<TestCommand> command={TestCommand} title='Update user' onValidationFailure={validationFailure}>
                <Fields />
            </CommandDialog>,
            'button:Ok',
        );
        await initialFocusSettled();
        await click('Ok');
        await refusalAnnounced();
    });

    afterEach(async () => unmount(dialog));

    it('should announce the number of problems and the first message', () =>
        expect(liveRegionText()).to.equal('There are 2 problems. First: Name is required'));

    it('should focus the first invalid field', () => expect(focusedElement()).to.equal('input:Name'));

    it('should still report the validation failure', () =>
        expect(validationFailure.mock.calls[0][0]).to.deep.equal(refusal.validationResults));
});
