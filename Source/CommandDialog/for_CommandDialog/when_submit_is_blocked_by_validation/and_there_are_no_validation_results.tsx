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

describe('when submit is blocked by validation and there are no validation results', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        refusal.validationResults = [];
        dialog = await render(
            <CommandDialog<TestCommand> command={TestCommand} title='Update user'>
                <Fields />
            </CommandDialog>,
            'button:Ok',
        );
        await initialFocusSettled();
        await click('Ok');
        await refusalAnnounced();
    });

    afterEach(async () => unmount(dialog));

    it('should announce the generic refusal', () =>
        expect(liveRegionText()).to.equal('The action was not completed. Review the dialog and try again.'));

    it('should return focus to the confirm button', () => expect(focusedElement()).to.equal('button:Ok'));
});
