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

const announce = vi.fn(() => 'Retten feltene som er markert');

describe('when submit is blocked by validation and an announcement is supplied', () => {
    let dialog: DialogInTheDom;

    beforeEach(async () => {
        announce.mockClear();
        refusal.validationResults = [{ message: 'Name is required', members: ['name'] }];
        dialog = await render(
            <CommandDialog<TestCommand> command={TestCommand} title='Update user' validationAnnouncement={announce}>
                <Fields />
            </CommandDialog>,
            'button:Ok',
        );
        await initialFocusSettled();
        await click('Ok');
        await refusalAnnounced();
    });

    afterEach(async () => unmount(dialog));

    it('should announce the supplied text', () => expect(liveRegionText()).to.equal('Retten feltene som er markert'));

    it('should build the text from the validation results', () =>
        expect(announce.mock.calls[0]).to.deep.equal([refusal.validationResults]));

    it('should focus the first invalid field', () => expect(focusedElement()).to.equal('input:Name'));
});
